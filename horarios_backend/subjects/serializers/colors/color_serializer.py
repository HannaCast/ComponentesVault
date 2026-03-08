from rest_framework import serializers
from subjects.models import Colors



class ColorSerializer(serializers.ModelSerializer):
    """ Serializador de escritura para Colors (POST, PUT) """

    class Meta:
        model = Colors
        fields = ('name', 'hex', 'contrast_hex')

    def create(self, validated_data):
        """ Crea un color con status activo por defecto """
        validated_data['status'] = 1
        return Colors.objects.create(**validated_data)
