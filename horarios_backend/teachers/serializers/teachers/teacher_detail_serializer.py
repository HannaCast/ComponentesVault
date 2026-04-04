from rest_framework import serializers
from teachers.models import Teachers
from teachers.utils import get_teacher_university_link


class TeacherDetailSerializer(serializers.ModelSerializer):
    """Serializador de detalle para Teachers (GET por ID)."""

    full_name = serializers.SerializerMethodField()
    require_classroom_display = serializers.SerializerMethodField()
    university_link_status = serializers.SerializerMethodField()

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
            'university_link_status',
        )

    def get_full_name(self, obj):
        parts = [obj.name, obj.surname]
        if obj.last_name:
            parts.append(obj.last_name)
        return ' '.join(parts)

    def get_require_classroom_display(self, obj):
        return 'Requiere salón' if obj.require_classroom == 1 else 'Tiene oficina'

    def get_university_link_status(self, obj):
        uid = self.context.get('selected_university_id')
        if not uid:
            return None
        link = get_teacher_university_link(obj.pk, uid)
        return link.status if link else None
