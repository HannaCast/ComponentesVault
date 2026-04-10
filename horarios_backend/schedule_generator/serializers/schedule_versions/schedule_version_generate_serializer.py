from rest_framework import serializers


class ScheduleVersionGenerateSerializer(serializers.Serializer):
    label = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    parameters = serializers.JSONField(
        required=False,
        default=dict,
        help_text=(
            'Objeto JSON opcional. Soporta '
            'allow_multiple_teachers_per_group_subject (bool).'
        ),
    )
    is_confirmed = serializers.HiddenField(default=0)
    is_deleted = serializers.HiddenField(default=0)

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

    def validate_parameters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('parameters debe ser un objeto JSON.')

        normalized = dict(value)
        key = 'allow_multiple_teachers_per_group_subject'
        if key in normalized:
            normalized[key] = self._parse_boolean(normalized[key], key)

        return normalized
