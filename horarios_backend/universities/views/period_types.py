from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from universities.models import PeriodTypes
from universities.serializers.period_types import PeriodTypeListSerializer


@extend_schema(
    tags=['Period types'],
    responses=PeriodTypeListSerializer(many=True),
)
class PeriodTypesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = PeriodTypes.objects.filter(status=1).order_by('name', 'id')
        return ApiResponse.success(
            PeriodTypeListSerializer(queryset, many=True).data
        )

