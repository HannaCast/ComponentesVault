from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from drf_spectacular.utils import extend_schema
from core.api_response import ApiResponse
from .serializers import LoginSerializer, RegisterSerializer

# Duración de la cookie en segundos (igual que REFRESH_TOKEN_LIFETIME)
_REFRESH_COOKIE_MAX_AGE = int(
    settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
)
_REFRESH_COOKIE_PATH = '/api/v1/auth/'


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
        """ Autentica al usuario: devuelve el access token en body y el refresh en HttpOnly cookie """
        response = super().post(request, *args, **kwargs)
        tokens = response.data
        resp = ApiResponse.success(
            data={'access': tokens['access']},
            message='Inicio de sesión exitoso',
        )
        _set_refresh_cookie(resp, tokens['refresh'])
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
            return ApiResponse.success(
                data={'access': new_access},
                message='Token renovado exitosamente',
            )
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
        resp.delete_cookie('refresh_token', path=_REFRESH_COOKIE_PATH)
        return resp


@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        """ Retorna los datos del usuario autenticado """
        user = request.user
        return ApiResponse.success(data={
            'name': user.name,
            'email': user.email,
            'role': user.role.name if user.role else None,
        })