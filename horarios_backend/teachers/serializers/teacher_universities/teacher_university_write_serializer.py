from rest_framework import serializers

from teachers.models import Teachers, TeachersUniversities


class TeacherUniversityWriteSerializer(serializers.ModelSerializer):
    """Alta/edición del vínculo profesor ↔ universidad (universidad = contexto)."""

    teachers = serializers.PrimaryKeyRelatedField(
        queryset=Teachers.objects.filter(is_deleted=0),
    )

    class Meta:
        model = TeachersUniversities
        fields = ['teachers', 'status']

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        teacher = attrs.get('teachers') or getattr(self.instance, 'teachers', None)
        if teacher is None:
            return attrs

        if self.instance is None:
            exists = TeachersUniversities.objects.filter(
                teachers=teacher,
                universities_id=selected_university_id,
                is_deleted=0,
            ).exists()
            if exists:
                raise serializers.ValidationError(
                    {
                        'teachers': (
                            'Este profesor ya está vinculado a la universidad seleccionada.'
                        ),
                    }
                )

        if self.instance is not None and 'teachers' in attrs:
            if attrs['teachers'].pk != self.instance.teachers_id:
                raise serializers.ValidationError(
                    {'teachers': 'No se puede cambiar el profesor; elimine el vínculo y cree uno nuevo.'}
                )

        return attrs

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        status = validated_data.pop('status', 1)
        teacher = validated_data.pop('teachers')

        existing = TeachersUniversities.objects.filter(
            teachers=teacher,
            universities_id=selected_university_id,
        ).first()

        if existing:
            if existing.is_deleted == 0:
                raise serializers.ValidationError(
                    {
                        'teachers': (
                            'Este profesor ya está vinculado a la universidad seleccionada.'
                        ),
                    }
                )
            existing.is_deleted = 0
            existing.status = status
            existing.save(update_fields=['is_deleted', 'status'])
            return existing

        return TeachersUniversities.objects.create(
            teachers=teacher,
            universities_id=selected_university_id,
            status=status,
            is_deleted=0,
        )

    def update(self, instance, validated_data):
        validated_data.pop('teachers', None)
        return super().update(instance, validated_data)
