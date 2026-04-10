from rest_framework import serializers


class ScheduleVersionUpdateDraftSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=100, required=False, allow_blank=False)
    academic_period_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    parameters = serializers.JSONField(required=False)
    data = serializers.JSONField(required=False)
    assigned_count = serializers.IntegerField(required=False, min_value=0)
    unassigned_count = serializers.IntegerField(required=False, min_value=0)

    def _parse_boolean(self, value, field_name: str) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, int):
            return value != 0
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {'true', '1', 'yes', 'si'}:
                return True
            if normalized in {'false', '0', 'no'}:
                return False

        raise serializers.ValidationError(
            {
                field_name: (
                    'Debe ser booleano (true/false) o equivalente '
                    'normalizable (1/0, yes/no).'
                )
            }
        )

    def validate_label(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('El label no puede estar vacío.')
        return cleaned

    def validate_parameters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('parameters debe ser un objeto JSON.')

        normalized = dict(value)
        key = 'allow_multiple_teachers_per_group_subject'
        if key in normalized:
            normalized[key] = self._parse_boolean(normalized[key], key)

        return normalized

    def validate_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('data debe ser un objeto JSON.')
        return value

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('Debe enviar al menos un campo para actualizar el borrador.')
        return attrs
