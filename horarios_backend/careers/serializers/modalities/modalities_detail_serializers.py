from careers.models import Modalities
from rest_framework import serializers

class ModalitiesDetailSerializer(serializers.ModelSerializer):
    university = serializers.StringRelatedField()

    class Meta:
        model = Modalities
        fields = (
            'id',
            'name',
            'require_classroom',
            'status',
            'configurations',
            'university',
        )