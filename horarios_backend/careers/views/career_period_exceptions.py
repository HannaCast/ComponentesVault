from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from careers.models import CareerPeriodExceptions
from careers.serializers.career_period_exceptions import (
    CareerPeriodExceptionDetailSerializer,
    CareerPeriodExceptionListSerializer,
    CareerPeriodExceptionWriteSerializer,
)
from core.audit_context import with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Career period exceptions'])
class CareerPeriodExceptionListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
 feature/career_period_exceptions
        summary='Lista de excepciones de periodo',

        parameters=[
            OpenApiParameter(
                name='career',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description=(
                    'Opcional. Si se envía, solo se devuelven excepciones de esa carrera '
                    '(debe pertenecer a la universidad seleccionada).'
                ),
                description='Si se indica, solo excepciones de esta carrera (ID).',
                required=False,
            ),
        ],
    )
    def get(self, request):
        """Lista de periodos exceptuados (estadías, etc.) de la universidad.

        Query opcional: ?career=<id> — solo excepciones de esa carrera (misma universidad).
        """
        selected_university_id = request.selected_university_id

        queryset = CareerPeriodExceptions.objects.filter(
            is_deleted=0,
            career__university_id=selected_university_id,
        ).select_related('career')

        career_param = request.query_params.get('career')
        if career_param not in (None, ''):
            try:
                queryset = queryset.filter(career_id=int(career_param))
            except (TypeError, ValueError):
                return ApiResponse.error(
                    message='Parámetro career inválido.',
                    errors={'career': ['Debe ser un identificador numérico.']},
                )

        queryset = queryset.order_by('career_id', 'period_number', 'id')

        career_param = request.query_params.get('career', '').strip()
        if career_param:
            try:
                career_id = int(career_param)
                if career_id > 0:
                    queryset = queryset.filter(career_id=career_id)
            except ValueError:
                return ApiResponse.error(
                    message='Parámetro career inválido.',
                    status_code=400,
                )

        return ApiResponse.success(
            CareerPeriodExceptionListSerializer(queryset, many=True).data
        )

    @extend_schema(request=CareerPeriodExceptionWriteSerializer)
    @with_audit_context(table_name='career_period_exceptions')
    @transaction.atomic
    def post(self, request):
        """Registrar excepción de periodo para una carrera."""
        selected_university_id = request.selected_university_id

        serializer = CareerPeriodExceptionWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(
                CareerPeriodExceptionDetailSerializer(row).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Career period exceptions'])
class CareerPeriodExceptionDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return CareerPeriodExceptions.objects.select_related('career').get(
                pk=pk,
                is_deleted=0,
                career__university_id=university_id,
            )
        except CareerPeriodExceptions.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            CareerPeriodExceptionDetailSerializer(row).data
        )

    @extend_schema(request=CareerPeriodExceptionWriteSerializer)
    @with_audit_context(table_name='career_period_exceptions')
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = CareerPeriodExceptionWriteSerializer(
            row,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )

        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                CareerPeriodExceptionDetailSerializer(row).data,
                message='Excepción de periodo actualizada correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='career_period_exceptions')
    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save()

        return ApiResponse.deleted('Excepción de periodo eliminada correctamente')
