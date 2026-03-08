from rest_framework import serializers
from subjects.models import Colors


class ColorDetailSerializer(serializers.ModelSerializer):
    """ Serializador de detalle para Colors (GET por ID) """

    hex          = serializers.SerializerMethodField()
    contrast_hex = serializers.SerializerMethodField()

    class Meta:
        model  = Colors
        fields = ('id', 'name', 'hex', 'contrast_hex', 'status')

    def get_hex(self, obj):
        return f'#{obj.hex}'

    def get_contrast_hex(self, obj):
        return f'#{obj.contrast_hex}'
