from rest_framework import serializers
from teachers.models import TeacherAvailabilities


class TeacherAvailabilityListSerializer(serializers.ModelSerializer):
    """Listado paginado de disponibilidades."""

    teacher_name = serializers.SerializerMethodField()
    day_of_week_label = serializers.SerializerMethodField()

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
