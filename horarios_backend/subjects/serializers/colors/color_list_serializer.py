from rest_framework import serializers
from subjects.models import Colors


class ColorListSerializer(serializers.ModelSerializer):
    """ Serializador de listado para Colors (GET paginado): id, nombre y hex """

    hex = serializers.SerializerMethodField()

    class Meta:
        model  = Colors
        fields = ('id', 'name', 'hex')

    def get_hex(self, obj):
        return f'#{obj.hex}'
