from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from classrooms.models import ClassroomCareers
from classrooms.serializers import (
    ClassroomCareerDetailSerializer,
    ClassroomCareerListSerializer,
    ClassroomCareerWriteSerializer,
)
from core.audit_context import with_audit_context
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Classroom careers'])
class ClassroomCareerListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        summary='Listar vínculos aula–carrera',
        parameters=[
            OpenApiParameter(
                name='classroom_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por id de aula',
                required=False,
            ),
        ],
    )
    def get(self, request):
        selected_university_id = request.selected_university_id

        queryset = ClassroomCareers.objects.filter(
            is_deleted=0,
            classrooms__universities_id=selected_university_id,
            classrooms__is_deleted=0,
            careers__university_id=selected_university_id,
            careers__is_deleted=0,
        ).select_related('classrooms', 'careers').order_by('classrooms_id', 'careers_id', 'id')

        classroom_id = request.query_params.get('classroom_id', None)
        if classroom_id is not None:
            try:
                queryset = queryset.filter(classrooms_id=int(classroom_id))
            except (TypeError, ValueError):
                pass

        return ApiResponse.success(
            ClassroomCareerListSerializer(queryset, many=True).data
        )

    @extend_schema(request=ClassroomCareerWriteSerializer)
    @with_audit_context(table_name='classroom_careers')
    @transaction.atomic
    def post(self, request):
        serializer = ClassroomCareerWriteSerializer(
            data=request.data,
            context={'selected_university_id': request.selected_university_id},
        )
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        classroom = serializer.validated_data['_classroom']
        career_id = serializer.validated_data['_career_id']

        base_qs = ClassroomCareers.objects.filter(
            classrooms=classroom,
            careers_id=career_id,
        )

        active = base_qs.filter(is_deleted=0).first()
        if active:
            return ApiResponse.error(
                message='La carrera ya está asignada al aula.',
                status_code=400,
            )

        soft = base_qs.filter(is_deleted=1).first()
        if soft:
            soft.is_deleted = 0
            soft.save(update_fields=['is_deleted'])
            row = soft
        else:
            row = ClassroomCareers.objects.create(
                classrooms=classroom,
                careers_id=career_id,
                is_deleted=0,
            )

        return ApiResponse.created(
            ClassroomCareerDetailSerializer(row).data,
            message='Carrera asignada al aula correctamente',
        )


@extend_schema(tags=['Classroom careers'])
class ClassroomCareerDetailView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get_object(self, pk, university_id):
        try:
            return ClassroomCareers.objects.select_related('classrooms', 'careers').get(
                pk=pk,
                is_deleted=0,
                classrooms__universities_id=university_id,
                classrooms__is_deleted=0,
                careers__university_id=university_id,
                careers__is_deleted=0,
            )
        except ClassroomCareers.DoesNotExist:
            return None

    def get(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        return ApiResponse.success(
            ClassroomCareerDetailSerializer(row).data
        )

    @with_audit_context(table_name='classroom_careers')
    @transaction.atomic
    def delete(self, request, pk):
        row = self.get_object(pk, request.selected_university_id)
        if row is None:
            return ApiResponse.not_found()

        row.is_deleted = 1
        row.save(update_fields=['is_deleted'])

        return ApiResponse.deleted('Vínculo aula–carrera eliminado correctamente')
