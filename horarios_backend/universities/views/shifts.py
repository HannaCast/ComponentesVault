from django.db import transaction

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.audit_context import with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from universities.models.shifts import Shifts
from universities.serializers.shifts import (
    ShiftDetailSerializer,
    ShiftListSerializer,
    ShiftWriteSerializer,
)


@extend_schema(tags=['Shifts'])
class ShiftListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        responses=ShiftListSerializer(many=True),
        summary='Listar turnos',
    )
    def get(self, request):
        """Turnos activos de la universidad seleccionada."""
        selected_university_id = request.selected_university_id

        shifts = (
            Shifts.objects.filter(
                status=1,
                is_deleted=0,
                university_id=selected_university_id,
            )
            .order_by('order', 'id')
        )

        return ApiResponse.success(
            ShiftListSerializer(shifts, many=True).data
        )

    @extend_schema(request=ShiftWriteSerializer)
    @with_audit_context(table_name='shifts')
    @transaction.atomic
    def post(self, request):
        """Crear turno."""
        selected_university_id = request.selected_university_id

        serializer = ShiftWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )

        if serializer.is_valid():
            shift = serializer.save()
            return ApiResponse.created(ShiftDetailSerializer(shift).data)

        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Shifts'])
class ShiftDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return Shifts.objects.select_related('university').get(
                pk=pk,
                is_deleted=0,
                university_id=university_id,
            )
        except Shifts.DoesNotExist:
            return None

    @extend_schema(responses=ShiftDetailSerializer, summary='Obtener turno')
    def get(self, request, pk):
        shift = self.get_object(pk, request.selected_university_id)
        if shift is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ShiftDetailSerializer(shift).data)

    @extend_schema(request=ShiftWriteSerializer)
    @with_audit_context(table_name='shifts')
    @transaction.atomic
    def put(self, request, pk):
        shift = self.get_object(pk, request.selected_university_id)
        if shift is None:
            return ApiResponse.not_found()

        serializer = ShiftWriteSerializer(
            shift,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )

        if serializer.is_valid():
            shift = serializer.save()
            return ApiResponse.success(
                ShiftDetailSerializer(shift).data,
                message='Turno actualizado correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='shifts')
    @transaction.atomic
    def delete(self, request, pk):
        shift = self.get_object(pk, request.selected_university_id)
        if shift is None:
            return ApiResponse.not_found()

        shift.is_deleted = 1
        shift.save()

        return ApiResponse.deleted('Turno eliminado correctamente')
