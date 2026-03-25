from rest_framework import serializers
from teachers.models import Teachers


class TeacherListSerializer(serializers.ModelSerializer):
    """Serializador de listado para Teachers (GET paginado)"""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teachers
        fields = ('id', 'name', 'first_name', 'last_name', 'full_name', 'status')

    def get_full_name(self, obj):
        return f'{obj.name} {obj.first_name} {obj.last_name}'
