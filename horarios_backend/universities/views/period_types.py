from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from universities.models import PeriodTypes
from universities.serializers.period_types import PeriodTypeSelectSerializer


@extend_schema(
    tags=["Period types"],
    responses=PeriodTypeSelectSerializer(many=True),
)
class PeriodTypesSelectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = PeriodTypes.objects.filter(status=1).order_by("name", "id")
        return ApiResponse.success(PeriodTypeSelectSerializer(queryset, many=True).data)