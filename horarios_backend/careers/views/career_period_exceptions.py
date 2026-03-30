from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from careers.models import CareerPeriodExceptions
from careers.serializers.career_period_exceptions import (
    CareerPeriodExceptionDetailSerializer,
    CareerPeriodExceptionListSerializer,
    CareerPeriodExceptionWriteSerializer,
)
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Career period exceptions'])
class CareerPeriodExceptionListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        """Lista de periodos exceptuados (estadías, etc.) de la universidad."""
        selected_university_id = request.selected_university_id

        queryset = CareerPeriodExceptions.objects.filter(
            is_deleted=0,
            career__university_id=selected_university_id,
        ).select_related('career').order_by('career_id', 'period_number', 'id')

        return ApiResponse.success(
            CareerPeriodExceptionListSerializer(queryset, many=True).data
        )

    @extend_schema(request=CareerPeriodExceptionWriteSerializer)
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

    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save()

        return ApiResponse.deleted('Excepción de periodo eliminada correctamente')
