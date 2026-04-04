from rest_framework import serializers

from teachers.models import TeachersUniversities


class TeacherUniversityListSerializer(serializers.ModelSerializer):
    teacher_id = serializers.IntegerField(source='teachers_id', read_only=True)
    teacher_full_name = serializers.SerializerMethodField()
    university_id = serializers.IntegerField(source='universities_id', read_only=True)
    university_short_name = serializers.CharField(
        source='universities.short_name',
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = TeachersUniversities
        fields = [
            'id',
            'teacher_id',
            'teacher_full_name',
            'university_id',
            'university_short_name',
            'status',
        ]

    def get_teacher_full_name(self, obj):
        t = obj.teachers
        parts = [t.name, t.surname]
        if t.last_name:
            parts.append(t.last_name)
        return ' '.join(parts)
