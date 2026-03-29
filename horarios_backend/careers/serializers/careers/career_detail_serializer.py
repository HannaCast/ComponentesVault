from rest_framework import serializers
from careers.models import Careers


class CareerDetailSerializer(serializers.ModelSerializer):
    university = serializers.CharField(source='university.name', read_only=True)
    modality = serializers.CharField(source='modality.name', read_only=True)

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
        )
