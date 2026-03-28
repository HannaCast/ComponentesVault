from rest_framework import serializers
from teachers.models import Teachers


class TeacherSelectSerializer(serializers.ModelSerializer):
    """Serializador para selects/dropdowns — solo id y nombre completo"""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teachers
        fields = ('id', 'full_name')

    def get_full_name(self, obj):
        parts = [obj.name, obj.surname]
        if obj.last_name:
            parts.append(obj.last_name)
        return ' '.join(parts)
