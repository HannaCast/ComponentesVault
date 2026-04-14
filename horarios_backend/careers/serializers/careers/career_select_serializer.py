from rest_framework import serializers
from careers.models import Careers


class CareerSelectSerializer(serializers.ModelSerializer):
    modality = serializers.CharField(source='modality.name', read_only=True)

    class Meta:
        model = Careers
        fields = ['id', 'name', 'short_name', 'modality', 'total_periods']
