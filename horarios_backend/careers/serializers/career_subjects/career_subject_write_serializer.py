from rest_framework import serializers
from careers.models import CareerSubjects, Careers
from subjects.models import Subjects


class CareerSubjectWriteSerializer(serializers.ModelSerializer):
    careers = serializers.PrimaryKeyRelatedField(
        queryset=Careers.objects.filter(is_deleted=0),
    )
    subjects = serializers.PrimaryKeyRelatedField(
        queryset=Subjects.objects.filter(is_deleted=0),
    )

    class Meta:
        model = CareerSubjects
        fields = ['subjects', 'careers', 'period_number']

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        career = attrs.get('careers') or getattr(self.instance, 'careers', None)
        subject = attrs.get('subjects') or getattr(self.instance, 'subjects', None)

        if career and career.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'careers': 'La carrera no pertenece a la universidad seleccionada.'}
            )

        if subject and subject.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'subjects': 'La materia no pertenece a la universidad seleccionada.'}
            )

        if career and subject and career.university_id != subject.university_id:
            raise serializers.ValidationError(
                {'subjects': 'La materia y la carrera deben pertenecer a la misma universidad.'}
            )

        period_number = attrs.get(
            'period_number',
            getattr(self.instance, 'period_number', None),
        )

        if career and subject and period_number is not None:
            exists = CareerSubjects.objects.filter(
                careers=career,
                subjects=subject,
                period_number=period_number,
                is_deleted=0,
            )
            if self.instance:
                exists = exists.exclude(pk=self.instance.pk)

            if exists.exists():
                raise serializers.ValidationError(
                    {
                        'subjects': (
                            'La materia ya está registrada para la carrera '
                            'en ese periodo.'
                        )
                    }
                )

        return attrs

    def validate_period_number(self, value):
        if value <= 0:
            raise serializers.ValidationError('Debe ser mayor a 0')
        return value

    def create(self, validated_data):
        validated_data['is_deleted'] = 0
        return CareerSubjects.objects.create(**validated_data)
