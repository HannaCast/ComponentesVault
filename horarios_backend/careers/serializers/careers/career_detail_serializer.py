from rest_framework import serializers

from careers.models import CareerPeriodExceptions, Careers
from careers.serializers.career_period_exceptions import (
    CareerPeriodExceptionListSerializer,
)


class CareerDetailSerializer(serializers.ModelSerializer):
    university = serializers.CharField(source='university.name', read_only=True)
    modality = serializers.CharField(source='modality.name', read_only=True)
    parent_career_name = serializers.CharField(source='parent_career.name', read_only=True)
    period_exceptions = serializers.SerializerMethodField()

    class Meta:
        model = Careers
        fields = (
            'id',
            'name',
            'short_name',
            'code',
            'university',
            'modality',
            'total_periods',
            'status',
            'parent_career_id',
            'parent_career_name',
            'continuation_from_period',
            'period_exceptions',
        )

    def get_period_exceptions(self, obj):
        rows = CareerPeriodExceptions.objects.filter(
            career_id=obj.pk,
            is_deleted=0,
        ).order_by('period_number', 'id')
        return CareerPeriodExceptionListSerializer(rows, many=True).data
