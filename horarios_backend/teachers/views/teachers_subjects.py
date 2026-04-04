from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.audit_context import with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from teachers.models import TeachersSubjects
from teachers.serializers.teachers_subjects import (
    TeacherSubjectDetailSerializer,
    TeacherSubjectListSerializer,
    TeacherSubjectWriteSerializer,
)


@extend_schema(tags=['Teachers subjects'])
class TeacherSubjectListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        selected_university_id = request.selected_university_id

        queryset = TeachersSubjects.objects.filter(
            is_deleted=0,
            subjects__university_id=selected_university_id,
            subjects__is_deleted=0,
            teachers__is_deleted=0,
        ).select_related('teachers', 'subjects').order_by('teachers_id', 'subjects_id', 'id')

        return ApiResponse.success(
            TeacherSubjectListSerializer(queryset, many=True).data
        )

    @extend_schema(request=TeacherSubjectWriteSerializer)
    @with_audit_context(table_name='teachers_subjects')
    @transaction.atomic
    def post(self, request):
        selected_university_id = request.selected_university_id

        serializer = TeacherSubjectWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(
                TeacherSubjectDetailSerializer(row).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Teachers subjects'])
class TeacherSubjectDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return TeachersSubjects.objects.select_related('teachers', 'subjects').get(
                pk=pk,
                is_deleted=0,
                subjects__university_id=university_id,
                subjects__is_deleted=0,
                teachers__is_deleted=0,
            )
        except TeachersSubjects.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            TeacherSubjectDetailSerializer(row).data
        )

    @extend_schema(request=TeacherSubjectWriteSerializer)
    @with_audit_context(table_name='teachers_subjects')
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = TeacherSubjectWriteSerializer(
            row,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )

        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                TeacherSubjectDetailSerializer(row).data,
                message='Asignación profesor-materia actualizada correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='teachers_subjects')
    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save()

        return ApiResponse.deleted(
            'Asignación profesor-materia eliminada correctamente'
        )
