from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from careers.models import CareerSubjects
from careers.serializers.career_subjects import (
    CareerSubjectDetailSerializer,
    CareerSubjectListSerializer,
    CareerSubjectWriteSerializer,
)
from core.audit_context import with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Career subjects'])
class CareerSubjectListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        """Lista de materias asociadas a carreras de la universidad."""
        selected_university_id = request.selected_university_id

        queryset = CareerSubjects.objects.filter(
            is_deleted=0,
            careers__university_id=selected_university_id,
            subjects__university_id=selected_university_id,
        ).select_related('careers', 'subjects').order_by('careers_id', 'period_number', 'id')

        return ApiResponse.success(
            CareerSubjectListSerializer(queryset, many=True).data
        )

    @extend_schema(request=CareerSubjectWriteSerializer)
    @with_audit_context(table_name='career_subjects')
    @transaction.atomic
    def post(self, request):
        """Registrar materia dentro del plan de una carrera."""
        selected_university_id = request.selected_university_id

        serializer = CareerSubjectWriteSerializer(
            data=request.data,
            context={'selected_university_id': selected_university_id},
        )
        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.created(
                CareerSubjectDetailSerializer(row).data
            )
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Career subjects'])
class CareerSubjectDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return CareerSubjects.objects.select_related('careers', 'subjects').get(
                pk=pk,
                is_deleted=0,
                careers__university_id=university_id,
                subjects__university_id=university_id,
            )
        except CareerSubjects.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()
        return ApiResponse.success(
            CareerSubjectDetailSerializer(row).data
        )

    @extend_schema(request=CareerSubjectWriteSerializer)
    @with_audit_context(table_name='career_subjects')
    @transaction.atomic
    def put(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        serializer = CareerSubjectWriteSerializer(
            row,
            data=request.data,
            partial=True,
            context={'selected_university_id': request.selected_university_id},
        )

        if serializer.is_valid():
            row = serializer.save()
            return ApiResponse.success(
                CareerSubjectDetailSerializer(row).data,
                message='Asignación materia-carrera actualizada correctamente',
            )

        return ApiResponse.error(errors=serializer.errors)

    @with_audit_context(table_name='career_subjects')
    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save()

        return ApiResponse.deleted(
            'Asignación materia-carrera eliminada correctamente'
        )
