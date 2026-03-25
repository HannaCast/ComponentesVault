from rest_framework import serializers
from teachers.models import Teachers


class TeacherDetailSerializer(serializers.ModelSerializer):
    """Serializador de detalle para Teachers (GET por ID)"""

    full_name = serializers.SerializerMethodField()
    required_classroom_display = serializers.SerializerMethodField()

    class Meta:
        model = Teachers
        fields = ('id','full_name', 'required_classroom', 'required_classroom_display', 'status')

    def get_full_name(self, obj):
        return f'{obj.name} {obj.first_name} {obj.last_name}'

    def get_required_classroom_display(self, obj):
        return 'Requiere salón' if obj.required_classroom == 1 else 'Tiene oficina'
