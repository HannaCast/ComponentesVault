from rest_framework import serializers
from careers.models import CareerPeriodExceptions


class CareerPeriodExceptionDetailSerializer(serializers.ModelSerializer):
    career = serializers.CharField(source='career.name', read_only=True)

    class Meta:
        model = CareerPeriodExceptions
        fields = (
            'id',
            'career',
            'period_number',
            'reason',
            'status',
        )
