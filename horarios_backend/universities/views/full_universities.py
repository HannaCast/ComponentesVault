import logging

from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import ValidationError as DrfValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from universities.models import Universities
from universities.serializers import FullSetupSerializer, UniversityWriteSerializer
from universities.services.full_setup_sync import (
    create_modalities_shifts_periods,
    update_full_setup,
)

logger = logging.getLogger(__name__)


@extend_schema(
    tags=['Setup'],
    summary='Setup completo de universidad',
    description='Crea universidad, múltiples modalidades, periodos académicos y turnos en una sola petición',
    request=FullSetupSerializer,
    responses={201: None},
)
class UniversityFullSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FullSetupSerializer(data=request.data)

        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        data = serializer.validated_data

        try:
            with transaction.atomic():
                university_serializer = UniversityWriteSerializer(data=data['university'])
                university_serializer.is_valid(raise_exception=True)

                university = university_serializer.save(
                    user=request.user,
                    created_at=timezone.now(),
                    created_by=request.user.get_username(),
                )

                create_modalities_shifts_periods(
                    university_id=university.id,
                    data=data,
                )

                return ApiResponse.created(
                    {
                        'message': 'Setup completo creado correctamente',
                        'university_id': university.id,
                    }
                )
        except DrfValidationError as exc:
            return ApiResponse.error(errors=exc.detail)
        except Exception:
            logger.exception('Error en setup completo de universidad')
            return ApiResponse.error(
                message='Error en setup completo',
                status_code=500,
                errors='Error interno al procesar la solicitud.',
            )


@extend_schema(
    tags=['Setup'],
    summary='Actualizar setup completo de universidad',
    description='Actualiza datos generales y sincroniza modalidades, periodos académicos y turnos',
    request=FullSetupSerializer,
    responses={200: None},
)
class UniversityFullSetupUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, university_id):
        serializer = FullSetupSerializer(data=request.data)

        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        data = serializer.validated_data

        try:
            with transaction.atomic():
                university = Universities.objects.select_for_update().get(
                    id=university_id,
                    user=request.user,
                    status=1,
                    is_deleted=0,
                )

                uid = update_full_setup(request=request, university=university, data=data)

                return ApiResponse.success(
                    {
                        'message': 'Setup actualizado correctamente',
                        'university_id': uid,
                    }
                )
        except Universities.DoesNotExist:
            return ApiResponse.error(
                message='Universidad no encontrada',
                status_code=404,
            )
        except DrfValidationError as exc:
            return ApiResponse.error(errors=exc.detail)
        except Exception:
            logger.exception('Error al actualizar setup completo de universidad')
            return ApiResponse.error(
                message='Error al actualizar setup completo',
                status_code=500,
                errors='Error interno al procesar la solicitud.',
            )
