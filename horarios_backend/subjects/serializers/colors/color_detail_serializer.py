from rest_framework import serializers
from subjects.models import Colors



class ColorDetailSerializer(serializers.ModelSerializer):
    """ Serializador de detalle para Colors (GET por ID) """

    class Meta:
        model = Colors
        fields = ('id', 'name', 'hex', 'contrast_hex')
