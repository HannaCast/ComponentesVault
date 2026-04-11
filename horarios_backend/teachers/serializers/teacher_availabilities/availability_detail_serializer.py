from rest_framework import serializers
from teachers.models import TeacherAvailabilities


class TeacherAvailabilityDetailSerializer(serializers.ModelSerializer):
    """Detalle de una disponibilidad."""

    teacher_name = serializers.SerializerMethodField()
    day_of_week_label = serializers.SerializerMethodField()
    is_available_label = serializers.SerializerMethodField()

    class Meta:
        model = TeacherAvailabilities
        fields = (
            'id',
            'teacher',
            'teacher_name',
            'day_of_week',
            'day_of_week_label',
            'start_time',
            'end_time',
            'is_available',
            'is_available_label',
        )

    def get_teacher_name(self, obj):
        t = obj.teacher
        parts = [t.name, t.surname]
        if t.last_name:
            parts.append(t.last_name)
        return ' '.join(parts)

    def get_day_of_week_label(self, obj):
        labels = {
            1: 'Lunes',
            2: 'Martes',
            3: 'Miércoles',
            4: 'Jueves',
            5: 'Viernes',
            6: 'Sábado',
            7: 'Domingo',
        }
        return labels.get(obj.day_of_week, str(obj.day_of_week))

    def get_is_available_label(self, obj):
        return 'Disponible' if obj.is_available == 1 else 'No disponible'
