from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema
from core.api_response import ApiResponse
from .serializers import LoginSerializer, RegisterSerializer


@extend_schema(tags=['Auth'])
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        """ Autentica al usuario y devuelve los tokens JWT """
        response = super().post(request, *args, **kwargs)
        return ApiResponse.success(data=response.data, message='Inicio de sesión exitoso')


@extend_schema(tags=['Auth'])
class RefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        """ Renueva el access token usando el refresh token """
        response = super().post(request, *args, **kwargs)
        return ApiResponse.success(data=response.data, message='Token renovado exitosamente')


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
    permission_classes = [IsAuthenticated]
    def post(self, request):
        """ Cierra la sesión e invalida el refresh token """
        token = RefreshToken(request.data["refresh"])
        token.blacklist()
        return ApiResponse.success(message='Sesión cerrada exitosamente')


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