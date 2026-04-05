from rest_framework import serializers


class TeacherAvailabilityInputSerializer(serializers.Serializer):
    day_of_week = serializers.IntegerField(min_value=1, max_value=7)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    is_available = serializers.BooleanField()

    def validate(self, attrs):
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError(
                {'end_time': 'La hora de fin debe ser mayor que la de inicio.'}
            )
        return attrs


class TeacherSubjectRefSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField(min_value=1)


class TeacherCompositePayloadSerializer(serializers.Serializer):
    """Body único para POST /api/v1/university/teachers/ (profesor + disponibilidades + materias)."""

    name = serializers.CharField(max_length=100)
    surname = serializers.CharField(max_length=100)
    last_name = serializers.CharField(
        max_length=100,
        allow_null=True,
        allow_blank=True,
        required=False,
    )
    require_classroom = serializers.BooleanField()
    availabilities = TeacherAvailabilityInputSerializer(many=True, required=False)
    subjects = TeacherSubjectRefSerializer(many=True, required=False)

    def validate_name(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('El nombre no puede estar vacío.')
        return str(value).strip()

    def validate_surname(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('El apellido paterno no puede estar vacío.')
        return str(value).strip()

    def validate_last_name(self, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        return value.strip()

    def validate(self, attrs):
        if 'availabilities' not in attrs:
            attrs['availabilities'] = []
        if 'subjects' not in attrs:
            attrs['subjects'] = []
        return attrs
