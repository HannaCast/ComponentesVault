from rest_framework import serializers
from careers.models import CareerPeriodExceptions


class CareerPeriodExceptionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerPeriodExceptions
        fields = ['id', 'career_id', 'period_number', 'reason']
