from rest_framework import serializers
from subjects.models import Colors



class ColorReadSerializer(serializers.ModelSerializer):
    """ Serializador de lectura para Colors (GET) """

    class Meta:
        model = Colors
        fields = ('id', 'name', 'hex', 'contrast_hex')
