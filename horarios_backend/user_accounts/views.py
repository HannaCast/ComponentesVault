from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema
from .serializers import LoginSerializer, RegisterSerializer


@extend_schema(tags=['Auth'])
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = []  # Público
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Usuario creado'}, status=201)
        return Response(serializer.errors, status=400)


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        token = RefreshToken(request.data["refresh"])
        token.blacklist()
        return Response(status=205)


@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Devuelve los datos del usuario autenticado
        user = request.user
        return Response({
            'name': user.name,
            'email': user.email,
            'role': user.role.name if user.role else None,
        })