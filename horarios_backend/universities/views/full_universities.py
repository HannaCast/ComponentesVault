from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse

from universities.serializers.universities.serializer_full import FullSetupSerializer

from universities.serializers.universities.university_write_serializer import UniversityWriteSerializer
from careers.serializers.modalities.modalities_write_serializers import ModalitiesWriteSerializer
from universities.serializers.academic_periods.academic_period_write_serializer import AcademicPeriodWriteSerializer
from universities.serializers.shifts.shift_write_serializer import ShiftWriteSerializer


@extend_schema(
    tags=['Setup'],
    summary='Setup completo de universidad',
    description='Crea universidad, múltiples modalidades, periodos académicos y turnos en una sola petición',
    request=FullSetupSerializer,
    responses={201: None}
)
class UniversityFullSetupView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = FullSetupSerializer(data=request.data)

        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        data = serializer.validated_data

        try:

            university_serializer = UniversityWriteSerializer(
                data=data['university']
            )
            university_serializer.is_valid(raise_exception=True)

            university = university_serializer.save(
                user=request.user,
                created_at=timezone.now(),
                created_by=request.user.get_username()
            )

            university_id = university.id


            for modality_data in data['modalities']:
                modality_serializer = ModalitiesWriteSerializer(
                    data=modality_data,
                    context={'selected_university_id': university_id}
                )
                modality_serializer.is_valid(raise_exception=True)
                modality_serializer.save()
            for period_data in data.get('academic_periods', []):
                period_serializer = AcademicPeriodWriteSerializer(
                    data=period_data,
                    context={'selected_university_id': university_id}
                )
                period_serializer.is_valid(raise_exception=True)
                period_serializer.save()
            for shift_data in data['shifts']:
                shift_serializer = ShiftWriteSerializer(
                    data=shift_data,
                    context={'selected_university_id': university_id}
                )
                shift_serializer.is_valid(raise_exception=True)
                shift_serializer.save()

            return ApiResponse.created({
                "message": "Setup completo creado correctamente",
                "university_id": university_id
            })

        except Exception as e:
            return ApiResponse.error(
                message="Error en setup completo",
                errors=str(e)
            )