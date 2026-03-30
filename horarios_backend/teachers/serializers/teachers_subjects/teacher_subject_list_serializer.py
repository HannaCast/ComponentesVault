from rest_framework import serializers
from teachers.models import TeachersSubjects


class TeacherSubjectListSerializer(serializers.ModelSerializer):
    teacher_full_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subjects.name', read_only=True)

    class Meta:
        model = TeachersSubjects
        fields = ['id', 'teachers', 'teacher_full_name', 'subjects', 'subject_name']

    def get_teacher_full_name(self, obj):
        parts = [obj.teachers.name, obj.teachers.surname]
        if obj.teachers.last_name:
            parts.append(obj.teachers.last_name)
        return ' '.join(parts)
