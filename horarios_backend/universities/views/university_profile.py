from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from careers.models import Modalities
from careers.serializers.modalities import ModalitiesDetailSerializer
from core.api_response import ApiResponse
from universities.models import AcademicPeriods, Shifts, Universities
from universities.serializers import (
    AcademicPeriodListSerializer,
    ShiftListSerializer,
    UniversityWriteSerializer,
)


@extend_schema(
    tags=['Universities'],
    summary='Perfil completo de universidad',
    description='Datos generales, modalidades, periodos académicos y turnos (para edición en el cliente).',
)
class UniversityProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, university_id):
        try:
            university = Universities.objects.select_related('period_type', 'image').get(
                id=university_id,
                status=1,
                is_deleted=0,
            )
        except Universities.DoesNotExist:
            return ApiResponse.error(
                message='Universidad no encontrada',
                status_code=404,
            )

        modalities = Modalities.objects.filter(
            university_id=university.id,
            status=1,
        ).order_by('id')

        shifts = Shifts.objects.filter(
            university_id=university.id,
            status=1,
            is_deleted=0,
        ).order_by('order', 'id')

        academic_periods = AcademicPeriods.objects.filter(
            university_id=university.id,
            is_deleted=0,
        ).order_by('order', 'id')

        payload = {
            **UniversityWriteSerializer(
                university,
                context={'request': request},
            ).data,
            'modalities': ModalitiesDetailSerializer(modalities, many=True).data,
            'shifts': ShiftListSerializer(shifts, many=True).data,
            'academic_periods': AcademicPeriodListSerializer(academic_periods, many=True).data,
        }

        return ApiResponse.success(payload)
