from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from user_accounts.serializers import ConfigurationSerializer, MeInfoSerializer


@extend_schema(tags=['Users'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna los datos del usuario autenticado."""
        serializer = MeInfoSerializer(request.user)
        return ApiResponse.success(data=serializer.data)


@extend_schema(tags=['Users'])
class ConfigurationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna la configuracion del usuario autenticado."""
        serializer = ConfigurationSerializer(request.user)
        return ApiResponse.success(data=serializer.data)
