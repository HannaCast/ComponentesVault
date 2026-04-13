from careers.models import Modalities
from rest_framework import serializers

_CONFIG_KEYS = frozenset({'allowed_days', 'classroom_days_per_week'})
_MIN_WEEKDAY = 1
_MAX_WEEKDAY = 7


class ModalitiesWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modalities
        fields = [
            'name',
            'require_classroom',
            'configurations',
        ]

    def _validate_configuration_keys(self, value):
        extra = set(value.keys()) - _CONFIG_KEYS
        if extra:
            raise serializers.ValidationError(
                f'Claves no permitidas: {", ".join(sorted(extra))}. '
                f'Solo se permiten: allowed_days, classroom_days_per_week.'
            )

        missing = _CONFIG_KEYS - set(value.keys())
        if missing:
            raise serializers.ValidationError(
                f'Faltan claves obligatorias: {", ".join(sorted(missing))}.'
            )

    def _validate_allowed_days(self, allowed_days):
        if not isinstance(allowed_days, list):
            raise serializers.ValidationError(
                {'allowed_days': 'Debe ser una lista de números de día.'}
            )
        if not allowed_days:
            raise serializers.ValidationError(
                {'allowed_days': 'Debe incluir al menos un día.'}
            )

        seen = set()
        for i, day in enumerate(allowed_days):
            if not isinstance(day, int) or isinstance(day, bool):
                raise serializers.ValidationError(
                    {'allowed_days': f'El elemento en la posición {i} debe ser un entero.'}
                )
            if day < _MIN_WEEKDAY or day > _MAX_WEEKDAY:
                raise serializers.ValidationError(
                    {
                        'allowed_days': (
                            f'Cada día debe estar entre {_MIN_WEEKDAY} y {_MAX_WEEKDAY} '
                            '(1=lunes … 7=domingo).'
                        )
                    }
                )
            if day in seen:
                raise serializers.ValidationError(
                    {'allowed_days': 'Los días no deben repetirse.'}
                )
            seen.add(day)

    def _validate_classroom_days_per_week(self, cdpw, allowed_days):
        if not isinstance(cdpw, int) or isinstance(cdpw, bool):
            raise serializers.ValidationError(
                {'classroom_days_per_week': 'Debe ser un entero.'}
            )
        if cdpw < 0:
            raise serializers.ValidationError(
                {'classroom_days_per_week': 'No puede ser negativo.'}
            )
        if cdpw > len(allowed_days):
            raise serializers.ValidationError(
                {
                    'classroom_days_per_week': (
                        'No puede ser mayor que la cantidad de días en allowed_days.'
                    )
                }
            )

    def validate_configurations(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Debe ser un objeto JSON.')

        self._validate_configuration_keys(value)

        allowed_days = value['allowed_days']
        self._validate_allowed_days(allowed_days)

        cdpw = value['classroom_days_per_week']
        self._validate_classroom_days_per_week(cdpw, allowed_days)

        return value

    def create(self, validated_data):
        """ Crea una modalidad con status activo por defecto """
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        return Modalities.objects.create(**validated_data)
    