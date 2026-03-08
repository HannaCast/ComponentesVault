import re
from rest_framework import serializers
from subjects.models import Colors

HEX_COLOR_RE = re.compile(r'^[0-9A-Fa-f]{6}$')


class ColorWriteSerializer(serializers.ModelSerializer):
    """ Serializador de escritura para Colors (POST, PUT) """

    class Meta:
        model = Colors
        fields = ('name', 'hex', 'contrast_hex')

    def _validate_hex_field(self, value):
        """ Acepta con o sin #, valida 6 chars hex, devuelve sin # en mayúsculas """
        clean = value.lstrip('#')
        if not HEX_COLOR_RE.match(clean):
            raise serializers.ValidationError(
                'Debe ser un color hexadecimal válido de 6 caracteres (ej. FF5733 o #FF5733).'
            )
        return clean.upper()

    def validate_hex(self, value):
        return self._validate_hex_field(value)

    def validate_contrast_hex(self, value):
        return self._validate_hex_field(value)

    def create(self, validated_data):
        """ Crea un color con status activo por defecto """
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Colors.objects.create(**validated_data)

