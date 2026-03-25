from rest_framework import serializers
from teachers.models import Teachers


class TeacherListSerializer(serializers.ModelSerializer):
    """Serializador de listado para Teachers (GET paginado)"""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teachers
        fields = ('id', 'full_name', 'required_classroom_display', 'status')

    def get_full_name(self, obj):
        return f'{obj.name} {obj.first_name} {obj.last_name}'
