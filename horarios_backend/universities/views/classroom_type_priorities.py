from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from core.audit_context import with_audit_context
from core.permissions import RequireSelectedUniversity
from universities.models import UniversityClassroomTypePriorities
from universities.serializers import (
    UniversityClassroomTypePriorityDetailSerializer,
    UniversityClassroomTypePriorityListSerializer,
    UniversityClassroomTypePriorityWriteSerializer,
)


@extend_schema(tags=['University classroom type priorities'])
class UniversityClassroomTypePriorityListCreateView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        rows = (
            UniversityClassroomTypePriorities.objects.filter(
                university_id=request.selected_university_id,
                is_deleted=0,
                classroom_type__is_deleted=0,
                classroom_type__status=1,
            )
            .select_related('university', 'classroom_type')
            .order_by('priority', 'id')
        )

        return ApiResponse.success(
            UniversityClassroomTypePriorityListSerializer(rows, many=True).data
        )

    @extend_schema(request=UniversityClassroomTypePriorityWriteSerializer)
    @with_audit_context(table_name='university_classroom_type_priorities')
    @transaction.atomic
    def post(self, request):
        serializer = UniversityClassroomTypePriorityWriteSerializer(
            data=request.data,
            context={'selected_university_id': request.selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(
                UniversityClassroomTypePriorityDetailSerializer(row).data
            )

        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['University classroom type priorities'])
class UniversityClassroomTypePriorityDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, selected_university_id):
        try:
            return UniversityClassroomTypePriorities.objects.select_related(
                'university',
                'classroom_type',
            ).get(
                pk=pk,
                university_id=selected_university_id,
                is_deleted=0,
            )
        except UniversityClassroomTypePriorities.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        return ApiResponse.success(
            UniversityClassroomTypePriorityDetailSerializer(row).data
        )

    @extend_schema(request=UniversityClassroomTypePriorityWriteSerializer)
    @with_audit_context(table_name='university_classroom_type_priorities')
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = UniversityClassroomTypePriorityWriteSerializer(
            row,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                UniversityClassroomTypePriorityDetailSerializer(row).data,
                message='Configuracion de prioridad actualizada correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='university_classroom_type_priorities')
    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save(update_fields=['is_deleted'])

        return ApiResponse.deleted('Configuracion de prioridad eliminada correctamente')
