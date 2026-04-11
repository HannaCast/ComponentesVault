from django.db import transaction
from rest_framework import serializers

from careers.models import CareerPeriodExceptions, Careers


class CareerPeriodExceptionNestedSerializer(serializers.Serializer):
    """Ítem para lista opcional `period_exceptions` en alta/edición de carrera."""

    period_number = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        default='',
    )


class CareerWriteSerializer(serializers.ModelSerializer):
    period_exceptions = CareerPeriodExceptionNestedSerializer(
        many=True,
        required=False,
        allow_empty=True,
        allow_null=True,
    )

    class Meta:
        model = Careers
        fields = [
            'name',
            'short_name',
            'code',
            'modality',
            'total_periods',
            'period_exceptions',
        ]

    def validate_total_periods(self, value):
        if value <= 0:
            raise serializers.ValidationError('Debe ser mayor a 0')
        return value

    def validate_modality(self, modality):
        selected_university_id = self.context.get('selected_university_id')
        if selected_university_id and modality.university_id != selected_university_id:
            raise serializers.ValidationError(
                'La modalidad no pertenece a la universidad seleccionada.'
            )
        return modality

    def validate_period_exceptions(self, value):
        if value is None:
            return []
        numbers = [item['period_number'] for item in value]
        if len(numbers) != len(set(numbers)):
            raise serializers.ValidationError(
                'Hay números de periodo duplicados en la lista.'
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        total_periods = attrs.get('total_periods')
        if total_periods is None and getattr(self, 'instance', None) is not None:
            total_periods = self.instance.total_periods

        exceptions = attrs.get('period_exceptions')
        if exceptions is not None and total_periods is not None:
            for item in exceptions:
                pn = item['period_number']
                if pn > total_periods:
                    raise serializers.ValidationError(
                        {
                            'period_exceptions': (
                                f'El periodo {pn} no puede ser mayor que '
                                f'total_periods ({total_periods}).'
                            )
                        }
                    )
        return attrs

    @staticmethod
    def _sync_period_exceptions(career, items):
        """Reemplaza excepciones activas por la lista enviada (soft-delete previas)."""
        CareerPeriodExceptions.objects.filter(
            career=career,
            is_deleted=0,
        ).update(is_deleted=1)
        for item in items:
            CareerPeriodExceptions.objects.create(
                career=career,
                period_number=item['period_number'],
                reason=(item.get('reason') or '').strip() or None,
                status=1,
                is_deleted=0,
            )

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        exceptions_data = validated_data.pop('period_exceptions', [])
        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0

        with transaction.atomic():
            career = Careers.objects.create(**validated_data)
            if exceptions_data:
                self._sync_period_exceptions(career, exceptions_data)
        return career

    def update(self, instance, validated_data):
        exceptions_in_request = 'period_exceptions' in getattr(
            self, 'initial_data', {}
        )
        exceptions_data = validated_data.pop('period_exceptions', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if exceptions_in_request:
            sync_list = exceptions_data if exceptions_data is not None else []
            with transaction.atomic():
                self._sync_period_exceptions(instance, sync_list)

        return instance
