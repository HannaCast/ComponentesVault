from rest_framework import serializers
from subjects.models import Subjects
from teachers.models import Teachers, TeachersSubjects


class TeacherSubjectWriteSerializer(serializers.ModelSerializer):
    teachers = serializers.PrimaryKeyRelatedField(
        queryset=Teachers.objects.filter(is_deleted=0),
    )
    subjects = serializers.PrimaryKeyRelatedField(
        queryset=Subjects.objects.filter(is_deleted=0),
    )

    class Meta:
        model = TeachersSubjects
        fields = ['teachers', 'subjects']

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        subject = attrs.get('subjects') or getattr(self.instance, 'subjects', None)
        if subject and subject.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'subjects': 'La materia no pertenece a la universidad seleccionada.'}
            )

        teacher = attrs.get('teachers') or getattr(self.instance, 'teachers', None)
        if teacher and teacher.is_deleted == 1:
            raise serializers.ValidationError(
                {'teachers': 'El profesor seleccionado no está disponible.'}
            )

        if teacher and subject:
            exists = TeachersSubjects.objects.filter(
                teachers=teacher,
                subjects=subject,
                is_deleted=0,
            )
            if self.instance:
                exists = exists.exclude(pk=self.instance.pk)

            if exists.exists():
                raise serializers.ValidationError(
                    {'teachers': 'El profesor ya está asignado a esta materia.'}
                )

        return attrs

    def create(self, validated_data):
        validated_data['is_deleted'] = 0
        return TeachersSubjects.objects.create(**validated_data)
