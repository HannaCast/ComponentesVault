from rest_framework import serializers

from universities.models import PeriodTypes


class PeriodTypeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodTypes
        fields = ['id', 'name', 'code']

