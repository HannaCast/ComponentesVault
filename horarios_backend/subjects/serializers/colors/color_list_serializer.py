from rest_framework import serializers
from subjects.models import Colors


class ColorListSerializer(serializers.ModelSerializer):
    """ Serializador de listado para Colors (GET paginado): id, nombre y hex """

    class Meta:
        model = Colors
        fields = ('id', 'name', 'hex')
