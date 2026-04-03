from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from core.audit_context import with_audit_context
from user_accounts.models import UserConfiguration
from user_accounts.serializers import (
    ConfigurationSerializer,
    MeInfoSerializer,
    SelectedUniversityUpdateSerializer,
)
from universities.models.universities import Universities


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
        """Retorna la configuracion del usuario autenticado desde user_configurations."""
        user_config = (
            UserConfiguration.objects
            .filter(user=request.user)
            .order_by('-id')
            .first()
        )

        if not user_config:
            return ApiResponse.not_found(message='Configuracion de usuario no encontrada')

        serializer = ConfigurationSerializer(user_config)
        return ApiResponse.success(data=serializer.data)


@extend_schema(tags=['Users'])
class SelectedUniversityConfigurationView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=SelectedUniversityUpdateSerializer)
    @with_audit_context(table_name='user_configurations')
    def put(self, request):
        """Asigna o limpia la universidad seleccionada del usuario autenticado."""
        serializer = SelectedUniversityUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        selected_university_id = serializer.validated_data.get('selected_university_id', None)
        selected_university = None
        if selected_university_id is not None:
            selected_university = Universities.objects.filter(
                id=selected_university_id,
                is_deleted=0,
            ).first()

        user_config, _ = UserConfiguration.objects.get_or_create(
            user=request.user,
            defaults={
                'theme': 'light',
                'accent': 'blue',
                'status': 1,
            },
        )

        user_config.selected_university = selected_university
        if user_config.status is None:
            user_config.status = 1
        user_config.save(update_fields=['selected_university', 'status'])

        response_serializer = ConfigurationSerializer(user_config)
        return ApiResponse.success(
            data=response_serializer.data,
            message='Universidad seleccionada actualizada exitosamente',
        )
