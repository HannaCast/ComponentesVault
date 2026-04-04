from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from classrooms.models import ClassroomCareers
from classrooms.serializers import (
    ClassroomCareerDetailSerializer,
    ClassroomCareerListSerializer,
)
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Classroom careers'])
class ClassroomCareerListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        selected_university_id = request.selected_university_id

        queryset = ClassroomCareers.objects.filter(
            is_deleted=0,
            classrooms__universities_id=selected_university_id,
            classrooms__is_deleted=0,
            careers__university_id=selected_university_id,
            careers__is_deleted=0,
        ).select_related('classrooms', 'careers').order_by('classrooms_id', 'careers_id', 'id')

        return ApiResponse.success(
            ClassroomCareerListSerializer(queryset, many=True).data
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
