from django.conf import settings
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from core.api_response import ApiResponse
from core.permissions import IsAdmin
from core.request_decryption import decrypt_request
from user_accounts.serializers import LoginSerializer, RegisterSerializer

# Duracion de las cookies en segundos
_ACCESS_COOKIE_MAX_AGE = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
_REFRESH_COOKIE_MAX_AGE = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
_ACCESS_COOKIE_PATH = '/'
_REFRESH_COOKIE_PATH = '/api/v1/auth/'


def _set_access_cookie(response, access_token: str) -> None:
    """Establece el access token como cookie HttpOnly segura."""
    response.set_cookie(
        'access_token',
        access_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=_ACCESS_COOKIE_MAX_AGE,
        path=_ACCESS_COOKIE_PATH,
    )


def _set_refresh_cookie(response, refresh_token: str) -> None:
    """Establece el refresh token como cookie HttpOnly segura."""
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path=_REFRESH_COOKIE_PATH,
    )


@extend_schema(tags=['Auth'])
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

    """@decrypt_request()"""
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """Autentica al usuario y establece access/refresh en cookies HttpOnly."""
        response = super().post(request, *args, **kwargs)
        tokens = response.data
        access_token = tokens['access']
        refresh_token = tokens['refresh']

        access_claims = RefreshToken(refresh_token).access_token
        resp = ApiResponse.success(
            data={
                'user': {
                    'id': access_claims.get('id'),
                    'role': access_claims.get('role'),
                }
            },
            message='Inicio de sesion exitoso',
        )
        _set_access_cookie(resp, access_token)
        _set_refresh_cookie(resp, refresh_token)
        return resp


@extend_schema(tags=['Auth'])
class RefreshView(APIView):
    permission_classes = []

    def post(self, request):
        """Renueva el access token leyendo el refresh desde la HttpOnly cookie."""
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return ApiResponse.error(message='No hay sesion activa')

        try:
            token = RefreshToken(refresh_token)
            new_access = str(token.access_token)
            resp = ApiResponse.success(
                data={'ok': True},
                message='Token renovado exitosamente',
            )
            _set_access_cookie(resp, new_access)
            return resp
        except Exception:
            return ApiResponse.error(message='Sesion expirada, inicia sesion nuevamente')


@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = []

    """@decrypt_request()"""
    @transaction.atomic
    def post(self, request):
        """Registra un nuevo usuario con rol usuario."""
        serializer = RegisterSerializer(
            data=request.data,
            context={'target_role_name': 'usuario'},
        )
        if serializer.is_valid():
            serializer.save()
            return ApiResponse.created(message='Usuario creado exitosamente')
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Auth'])
class RegisterAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @transaction.atomic
    def post(self, request):
        """Registra un nuevo administrador. Solo admins autenticados."""
        serializer = RegisterSerializer(
            data=request.data,
            context={'target_role_name': 'admin'},
        )
        if serializer.is_valid():
            serializer.save()
            return ApiResponse.created(message='Administrador creado exitosamente')
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        """Invalida el refresh token y elimina las cookies de sesion."""
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass

        resp = ApiResponse.success(message='Sesion cerrada exitosamente')
        resp.delete_cookie('access_token', path=_ACCESS_COOKIE_PATH)
        resp.delete_cookie('refresh_token', path=_REFRESH_COOKIE_PATH)
        return resp
