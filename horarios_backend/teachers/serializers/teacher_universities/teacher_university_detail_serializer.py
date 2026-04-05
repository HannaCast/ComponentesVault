from rest_framework import serializers

from teachers.models import TeachersUniversities


class TeacherUniversityDetailSerializer(serializers.ModelSerializer):
    teacher = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()

    class Meta:
        model = TeachersUniversities
        fields = ['id', 'teacher', 'university', 'status']

    def get_teacher(self, obj):
        t = obj.teachers
        parts = [t.name, t.surname]
        if t.last_name:
            parts.append(t.last_name)
        return {
            'id': t.pk,
            'full_name': ' '.join(parts),
        }

    def get_university(self, obj):
        u = obj.universities
        return {
            'id': u.pk,
            'name': u.name,
            'short_name': u.short_name,
        }
