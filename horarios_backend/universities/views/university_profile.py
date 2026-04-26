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


def _build_display_range(period):
    """Genera un rango legible desde start_date y end_date del periodo."""
    start = period.start_date
    end = period.end_date
    if start and end:
        return f'{start.strftime("%b %Y")} – {end.strftime("%b %Y")}'
    if start:
        return start.strftime('%b %Y')
    return None


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
                user=request.user,
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
        ).order_by('-id')

        # Periodo activo enriquecido con rango legible.
        active_period_obj = academic_periods.filter(is_active=1).first()
        active_period_payload = None
        if active_period_obj:
            active_period_payload = {
                'id': active_period_obj.id,
                'name': active_period_obj.name,
                'display_range': _build_display_range(active_period_obj),
            }

        # Serializar periodos con display_range incluido.
        periods_data = []
        for period in academic_periods:
            period_dict = AcademicPeriodListSerializer(period).data
            period_dict['display_range'] = _build_display_range(period)
            periods_data.append(period_dict)

        payload = {
            **UniversityWriteSerializer(
                university,
                context={'request': request},
            ).data,
            'period_type_name': (
                university.period_type.name if university.period_type_id else None
            ),
            'active_period': active_period_payload,
            'modalities': ModalitiesDetailSerializer(modalities, many=True).data,
            'shifts': ShiftListSerializer(shifts, many=True).data,
            'academic_periods': periods_data,
        }

        return ApiResponse.success(payload)

