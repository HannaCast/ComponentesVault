from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from drf_spectacular.utils import extend_schema
from core.api_response import ApiResponse
from .serializers import LoginSerializer, RegisterSerializer

# Duración de las cookies en segundos
_ACCESS_COOKIE_MAX_AGE = int(
    settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
)
_REFRESH_COOKIE_MAX_AGE = int(
    settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
)
_ACCESS_COOKIE_PATH = '/'
_REFRESH_COOKIE_PATH = '/api/v1/auth/'


def _set_access_cookie(response, access_token: str) -> None:
    """ Establece el access token como cookie HttpOnly segura """
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
    """ Establece el refresh token como cookie HttpOnly segura """
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=not settings.DEBUG,   # HTTPS en producción
        samesite='Lax',
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path=_REFRESH_COOKIE_PATH,
    )


@extend_schema(tags=['Auth'])
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        """ Autentica al usuario y establece access/refresh en cookies HttpOnly """
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
            message='Inicio de sesión exitoso',
        )
        _set_access_cookie(resp, access_token)
        _set_refresh_cookie(resp, refresh_token)
        return resp


@extend_schema(tags=['Auth'])
class RefreshView(APIView):
    permission_classes = []

    def post(self, request):
        """ Renueva el access token leyendo el refresh desde la HttpOnly cookie """
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return ApiResponse.error(message='No hay sesión activa')

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
            return ApiResponse.error(message='Sesión expirada, inicia sesión nuevamente')


@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = []
    def post(self, request):
        """ Registra un nuevo usuario en el sistema """
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return ApiResponse.created(message='Usuario creado exitosamente')
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        """ Invalida el refresh token y elimina la cookie """
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass  # token ya expirado o inválido, continuar de todos modos

        resp = ApiResponse.success(message='Sesión cerrada exitosamente')
        resp.delete_cookie('access_token', path=_ACCESS_COOKIE_PATH)
        resp.delete_cookie('refresh_token', path=_REFRESH_COOKIE_PATH)
        return resp


@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        """ Retorna los datos del usuario autenticado """
        user = request.user
        return ApiResponse.success(data={
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role.name if user.role else None,
        })