from rest_framework import serializers

from universities.models import Universities


class UniversityWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Universities
        fields = (
            'id',
            'name',
            'short_name',
            'institution_code',
            'image',
            'start_time',
            'end_time',
            'period_type',
            'uses_period_groups',
        )

    def create(self, validated_data):
        validated_data['uses_period_groups'] = validated_data.get('uses_period_groups', 0)
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Universities.objects.create(**validated_data)

    @staticmethod
    def _normalize_flag(value):
        if isinstance(value, bool):
            return 1 if value else 0

        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return None

        if parsed in (0, 1):
            return parsed
        return None

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate(self, data):
        if self.instance is not None and 'uses_period_groups' in data:
            current_flag = self._normalize_flag(self.instance.uses_period_groups)
            requested_flag = self._normalize_flag(data.get('uses_period_groups'))
            if requested_flag is None:
                raise serializers.ValidationError(
                    {'uses_period_groups': 'Valor inválido. Debe ser 0 o 1.'}
                )
            if current_flag != requested_flag:
                raise serializers.ValidationError(
                    {
                        'uses_period_groups': (
                            'No se puede cambiar este valor después de crear la universidad.'
                        )
                    }
                )

        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if self.instance is not None:
            if start_time is None:
                start_time = self.instance.start_time
            if end_time is None:
                end_time = self.instance.end_time

        if (
            start_time is not None
            and end_time is not None
            and start_time >= end_time
        ):
            raise serializers.ValidationError(
                "La hora de inicio debe ser menor que la hora de fin"
            )

        return data
