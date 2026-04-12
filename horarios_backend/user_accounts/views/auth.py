import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.db import IntegrityError, transaction
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from core.api_response import ApiResponse
from core.audit_context import with_audit_context
from core.email_service import EmailDeliveryError
from core.permissions import IsAdmin
from core.request_decryption import decrypt_request
from user_accounts.models import UserToken
from user_accounts.services import send_account_verification_email
from user_accounts.serializers import (
    LoginSerializer, RegisterSerializer, ChangePasswordSerializer, VerifyAccountSerializer,
)


# Duracion de las cookies en segundos
_ACCESS_COOKIE_MAX_AGE = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
_REFRESH_COOKIE_MAX_AGE = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
_ACCESS_COOKIE_PATH = '/'
_REFRESH_COOKIE_PATH = '/api/v1/auth/'
_EMAIL_VERIFICATION_TOKEN_TYPE = 'email_verification'
_EMAIL_VERIFICATION_TOKEN_TTL_HOURS = int(getattr(settings, 'EMAIL_VERIFICATION_TOKEN_TTL_HOURS', 24))


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


def _create_email_verification_token(user):
    """Crea un token de verificacion de cuenta sin enviar correo."""
    expires_at = timezone.now() + timedelta(hours=_EMAIL_VERIFICATION_TOKEN_TTL_HOURS)

    for _ in range(3):
        token_value = secrets.token_hex(32)
        try:
            return UserToken.objects.create(
                user=user,
                token=token_value,
                type=_EMAIL_VERIFICATION_TOKEN_TYPE,
                expires_at=expires_at,
            )
        except IntegrityError:
            # Reintenta solo en caso de colision por restriccion unique.
            continue

    raise ValueError('No fue posible generar un token de verificacion unico')


def _send_verification_email_or_rollback(user, verification_token):
    """Envia correo de verificacion y revierte la transaccion si falla."""
    try:
        send_account_verification_email(
            user=user,
            token=verification_token.token,
            expires_at=verification_token.expires_at,
        )
    except EmailDeliveryError:
        transaction.set_rollback(True)
        return ApiResponse.error(
            message='No fue posible enviar el correo de verificacion. Intenta nuevamente.',
            status_code=500,
        )

    return None


@extend_schema(tags=['Auth'])
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

    @decrypt_request()
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

@extend_schema(tags=['Users'])
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer)
    @decrypt_request()
    @with_audit_context(table_name='users')
    @transaction.atomic
    def put(self, request):
        """Actualiza la contraseña del usuario autenticado validando la contraseña anterior."""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'user': request.user},
        )
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        new_password = serializer.validated_data['new_password']
        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])

        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                # Evita que un problema de blacklist bloquee el cambio de contraseña.
                pass

        response = ApiResponse.success(
            message='Contraseña actualizada exitosamente. Inicia sesión nuevamente',
            data={'force_reauth': True},
        )
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/api/v1/auth/')
        return response

@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = []

    @decrypt_request()
    @with_audit_context(table_name='users')
    @transaction.atomic
    def post(self, request):
        """Registra un nuevo usuario con rol usuario."""
        serializer = RegisterSerializer(
            data=request.data,
            context={'target_role_name': 'usuario'},
        )
        if serializer.is_valid():
            user = serializer.save()
            verification_token = _create_email_verification_token(user)

            email_error_response = _send_verification_email_or_rollback(user, verification_token)
            if email_error_response:
                return email_error_response

            return ApiResponse.created(
                message='Usuario creado exitosamente. Revisa tu correo para verificar la cuenta.',
                data={'email': user.email},
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Auth'])
class RegisterAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @with_audit_context(table_name='users')
    @transaction.atomic
    def post(self, request):
        """Registra un nuevo administrador. Solo admins autenticados."""
        serializer = RegisterSerializer(
            data=request.data,
            context={'target_role_name': 'admin'},
        )
        if serializer.is_valid():
            user = serializer.save()
            verification_token = _create_email_verification_token(user)

            email_error_response = _send_verification_email_or_rollback(user, verification_token)
            if email_error_response:
                return email_error_response

            return ApiResponse.created(
                message='Administrador creado exitosamente. Se envio correo de verificacion.',
                data={'email': user.email},
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Auth'])
class VerifyAccountView(APIView):
    permission_classes = []

    @extend_schema(request=VerifyAccountSerializer)
    @decrypt_request()
    @transaction.atomic
    def post(self, request):
        """Verifica una cuenta con token y la activa."""
        serializer = VerifyAccountSerializer(data=request.data)
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        token_value = serializer.validated_data['token']
        now = timezone.now()

        user_token = (
            UserToken.objects
            .select_related('user')
            .select_for_update()
            .filter(token=token_value, type=_EMAIL_VERIFICATION_TOKEN_TYPE)
            .first()
        )

        if not user_token:
            return ApiResponse.error(message='Token de verificacion invalido')

        if user_token.used_at is not None:
            return ApiResponse.error(message='Token de verificacion ya utilizado')

        if user_token.expires_at < now:
            return ApiResponse.error(message='Token de verificacion expirado')

        user = user_token.user
        if getattr(user, 'is_verificated', 0) != 1:
            user.is_verificated = 1
            user.save(update_fields=['is_verificated'])

        user_token.used_at = now
        user_token.save(update_fields=['used_at'])

        return ApiResponse.success(
            data={'user_id': user.id},
            message='Cuenta verificada exitosamente',
        )


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
