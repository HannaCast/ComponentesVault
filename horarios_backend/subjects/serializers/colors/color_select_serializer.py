from rest_framework import serializers
from subjects.models import Colors


class ColorSelectSerializer(serializers.ModelSerializer):
    """ Serializador para selects/dropdowns — solo id y name """
    class Meta:
        model  = Colors
        fields = ('id', 'name')
