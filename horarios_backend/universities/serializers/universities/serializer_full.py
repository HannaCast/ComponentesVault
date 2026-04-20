from rest_framework import serializers


class FullSetupSerializer(serializers.Serializer):
    university = serializers.DictField()
    modalities = serializers.ListField(child=serializers.DictField())
    academic_periods = serializers.ListField(required=False, child=serializers.DictField())
    shifts = serializers.ListField(child=serializers.DictField())

    def validate_modalities(self, value):
        if not value:
            raise serializers.ValidationError('Debe enviar al menos una modalidad.')
        return value

    @staticmethod
    def _parse_time_or_none(value):
        if value in (None, ''):
            return None

        try:
            return serializers.TimeField().to_internal_value(value)
        except serializers.ValidationError:
            return None

    def validate(self, attrs):
        university = attrs.get('university') or {}
        shifts = attrs.get('shifts') or []

        uni_start = self._parse_time_or_none(university.get('start_time'))
        uni_end = self._parse_time_or_none(university.get('end_time'))
        if uni_start is None or uni_end is None:
            return attrs

        shift_errors = []
        for index, shift in enumerate(shifts):
            shift_start = self._parse_time_or_none(shift.get('start_time'))
            shift_end = self._parse_time_or_none(shift.get('end_time'))
            if shift_start is None or shift_end is None:
                continue

            if shift_start < uni_start or shift_end > uni_end:
                shift_errors.append(
                    (
                        f'El turno en la posición {index + 1} debe estar dentro del horario '
                        f'de apertura y cierre de la universidad '
                        f'({uni_start.strftime("%H:%M")} - {uni_end.strftime("%H:%M")}).'
                    )
                )

        if shift_errors:
            raise serializers.ValidationError({'shifts': shift_errors})

        return attrs