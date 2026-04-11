from rest_framework import serializers
from subjects.models import Colors


class ColorSelectSerializer(serializers.ModelSerializer):
    """ Serializador para selects/dropdowns — id, name y hex """
    hex = serializers.SerializerMethodField()

    class Meta:
        model = Colors
        fields = ('id', 'name', 'hex')

    def get_hex(self, obj):
        clean = (obj.hex or '').strip()
        return clean if clean.startswith('#') else f'#{clean}'
