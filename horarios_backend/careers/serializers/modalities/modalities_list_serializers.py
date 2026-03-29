from careers.models import Modalities
from rest_framework import serializers

class ModalitiesListSerializer(serializers.ModelSerializer):
    university = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = Modalities
        fields = [
            'id', 
            'name', 
            'require_classroom', 
            'status', 
            'configurations', 
            'university'
        ]