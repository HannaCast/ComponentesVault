from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer, RegisterSerializer

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

class RegisterView(APIView):
    permission_classes = []  # Público
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Usuario creado'}, status=201)
        return Response(serializer.errors, status=400)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        token = RefreshToken(request.data["refresh"])
        token.blacklist()
        return Response(status=205)

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