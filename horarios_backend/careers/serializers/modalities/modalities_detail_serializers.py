from careers.models import Modalities
from rest_framework import serializers

class ModalitiesDetailSerializer(serializers.ModelSerializer):
    universitiy = serializers.StringRelatedField()

    class Meta:
        model = Modalities
        fields = ('id', 'name', 'configurations')