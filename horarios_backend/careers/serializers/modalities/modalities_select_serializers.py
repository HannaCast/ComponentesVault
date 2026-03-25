from careers.models import Modalities
from rest_framework import serializers

class ModalitiesSelectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modalities
        fields = ['id', 'name', 'require_classroom']