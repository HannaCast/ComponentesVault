from django.db import transaction

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.audit_context import with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from teachers.models import TeachersUniversities
from teachers.serializers.teacher_universities import (
    TeacherUniversityDetailSerializer,
    TeacherUniversityListSerializer,
    TeacherUniversityWriteSerializer,
)


@extend_schema(tags=['Teachers universities'])
class TeacherUniversityListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        responses=TeacherUniversityListSerializer(many=True),
        summary='Listar vínculos profesor-universidad',
    )
    def get(self, request):
        """Vínculos activos (no eliminados) de la universidad seleccionada."""
        uid = request.selected_university_id
        qs = (
            TeachersUniversities.objects.filter(
                universities_id=uid,
                is_deleted=0,
            )
            .select_related('teachers', 'universities')
            .order_by('teachers__surname', 'teachers__name', 'id')
        )
        return ApiResponse.success(
            TeacherUniversityListSerializer(qs, many=True).data
        )

    @extend_schema(request=TeacherUniversityWriteSerializer)
    @with_audit_context(table_name='teachers_universities')
    @transaction.atomic
    def post(self, request):
        """Vincular un profesor existente a la universidad seleccionada."""
        uid = request.selected_university_id
        serializer = TeacherUniversityWriteSerializer(
            data=request.data,
            context={'selected_university_id': uid},
        )
        if serializer.is_valid():
            row = serializer.save()
            row = TeachersUniversities.objects.select_related(
                'teachers', 'universities'
            ).get(pk=row.pk)
            return ApiResponse.created(
                TeacherUniversityDetailSerializer(row).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Teachers universities'])
class TeacherUniversityDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return TeachersUniversities.objects.select_related(
                'teachers', 'universities'
            ).get(
                pk=pk,
                universities_id=university_id,
                is_deleted=0,
            )
        except TeachersUniversities.DoesNotExist:
            return None

    @extend_schema(responses=TeacherUniversityDetailSerializer)
    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            TeacherUniversityDetailSerializer(row).data
        )

    @extend_schema(request=TeacherUniversityWriteSerializer)
    @with_audit_context(table_name='teachers_universities')
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = TeacherUniversityWriteSerializer(
            row,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                TeacherUniversityDetailSerializer(row).data,
                message='Vínculo profesor-universidad actualizado correctamente',
            )
        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='teachers_universities')
    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        row.is_deleted = 1
        row.save(update_fields=['is_deleted'])
        return ApiResponse.deleted(
            'Vínculo profesor-universidad eliminado correctamente'
        )
