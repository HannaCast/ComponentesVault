from rest_framework import serializers
from careers.models import Careers


class CareerListSerializer(serializers.ModelSerializer):
    modality = serializers.CharField(source='modality.name', read_only=True)

    class Meta:
        model = Careers
        fields = [
            'id',
            'name',
            'code',
            'modality',
            'total_periods',
            'status',
        ]
