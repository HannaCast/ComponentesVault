from rest_framework import serializers
from universities.models import PeriodTypes


class PeriodTypeSelectSerializer(serializers.ModelSerializer):
    value = serializers.IntegerField(source="id")
    label = serializers.CharField(source="name")

    class Meta:
        model = PeriodTypes
        fields = ["value", "label"]