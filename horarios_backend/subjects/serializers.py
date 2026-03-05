from rest_framework import serializers
from .models import Colors


class ColorSerializer(serializers.ModelSerializer):
    """ Serializador del modelo Colors """
    class Meta:
        model = Colors
        fields = ('id', 'name', 'hex', 'contrast_hex', 'status')
