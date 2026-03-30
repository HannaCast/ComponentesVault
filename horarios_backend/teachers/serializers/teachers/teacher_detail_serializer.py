from rest_framework import serializers
from teachers.models import Teachers


class TeacherDetailSerializer(serializers.ModelSerializer):
    """Serializador de detalle para Teachers (GET por ID)"""

    full_name = serializers.SerializerMethodField()
    require_classroom_display = serializers.SerializerMethodField()

    class Meta:
        model = Teachers
        fields = (
            'id',
            'name',
            'surname',
            'last_name',
            'full_name',
            'require_classroom',
            'require_classroom_display',
            'status',
        )

    def get_full_name(self, obj):
        parts = [obj.name, obj.surname]
        if obj.last_name:
            parts.append(obj.last_name)
        return ' '.join(parts)

    def get_require_classroom_display(self, obj):
        return 'Requiere salón' if obj.require_classroom == 1 else 'Tiene oficina'
