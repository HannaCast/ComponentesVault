from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from classrooms.models import ClassroomTypes
from classrooms.serializers import ClassroomTypeSelectSerializer
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity


@extend_schema(tags=['Classroom types'])
class ClassroomTypesListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    def get(self, request):
        queryset = ClassroomTypes.objects.filter(
            status=1,
            is_deleted=0,
        ).order_by('name', 'id')
        return ApiResponse.success(
            ClassroomTypeSelectSerializer(queryset, many=True).data
        )

