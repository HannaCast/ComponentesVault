from rest_framework import serializers
from teachers.models import TeachersSubjects


class TeacherSubjectDetailSerializer(serializers.ModelSerializer):
    teachers = serializers.SerializerMethodField()
    subjects = serializers.SerializerMethodField()

    class Meta:
        model = TeachersSubjects
        fields = (
            'id',
            'teachers',
            'subjects',
        )

    def get_teachers(self, obj):
        parts = [obj.teachers.name, obj.teachers.surname]
        if obj.teachers.last_name:
            parts.append(obj.teachers.last_name)

        return {
            'id': obj.teachers_id,
            'full_name': ' '.join(parts),
        }

    def get_subjects(self, obj):
        return {
            'id': obj.subjects_id,
            'name': obj.subjects.name,
        }
