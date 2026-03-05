from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema
from core.api_response import ApiResponse
from .serializers import LoginSerializer, RegisterSerializer


@extend_schema(tags=['Auth'])
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = []
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return ApiResponse.created(message='Usuario creado exitosamente')
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        token = RefreshToken(request.data["refresh"])
        token.blacklist()
        return ApiResponse.success(message='Sesión cerrada exitosamente')


@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        return ApiResponse.success(data={
            'name': user.name,
            'email': user.email,
            'role': user.role.name if user.role else None,
        })