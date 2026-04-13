from django.db import transaction
from rest_framework import serializers

from universities.models import AcademicPeriods, Universities


class AcademicPeriodWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicPeriods
        fields = [
            'name',
            'start_month',
            'end_month',
            'year',
            'order',
            'is_active',
        ]

    @staticmethod
    def _validate_month_range(value):
        if value < 1 or value > 12:
            raise serializers.ValidationError('Debe estar entre 1 y 12.')
        return value

    def validate_start_month(self, value):
        return self._validate_month_range(value)

    def validate_end_month(self, value):
        return self._validate_month_range(value)

    @staticmethod
    def _get_selected_university_id(context):
        selected_university_id = context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )
        return selected_university_id

    @staticmethod
    def _get_university_for_validation(selected_university_id):
        university = Universities.objects.only(
            'id',
            'uses_period_groups',
        ).filter(id=selected_university_id).first()

        if university is None:
            raise serializers.ValidationError(
                {'university': 'La universidad seleccionada no existe.'}
            )

        return university

    @staticmethod
    def _validate_period_group_fields(attrs, uses_period_groups):
        year = attrs.get('year')
        order = attrs.get('order')

        if uses_period_groups:
            if year is None:
                raise serializers.ValidationError(
                    {'year': 'Este campo es obligatorio cuando uses_period_groups = True.'}
                )
            if order is None:
                raise serializers.ValidationError(
                    {'order': 'Este campo es obligatorio cuando uses_period_groups = True.'}
                )
        elif year is not None or order is not None:
            raise serializers.ValidationError(
                {
                    'order': (
                        'Los campos order/year solo deben enviarse cuando '
                        'uses_period_groups = True.'
                    )
                }
            )

        return order

    def _validate_unique_order(self, selected_university_id, uses_period_groups, order):
        if not uses_period_groups or order is None:
            return

        qs = AcademicPeriods.objects.filter(
            university_id=selected_university_id,
            is_deleted=0,
            order=order,
        )
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {'order': 'Ya existe un periodo con ese order en la universidad.'}
            )

    @staticmethod
    def _validate_is_active_field(attrs):
        is_active = attrs.get('is_active')
        if is_active is not None and is_active not in (0, 1):
            raise serializers.ValidationError(
                {'is_active': 'Debe ser 0 o 1.'}
            )

    def validate(self, attrs):
        selected_university_id = self._get_selected_university_id(self.context)
        university = self._get_university_for_validation(selected_university_id)

        uses_period_groups = int(university.uses_period_groups or 0) == 1
        order = self._validate_period_group_fields(attrs, uses_period_groups)
        self._validate_unique_order(selected_university_id, uses_period_groups, order)
        self._validate_is_active_field(attrs)

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')

        validated_data['university_id'] = selected_university_id
        validated_data['is_deleted'] = 0
        validated_data['is_active'] = validated_data.get('is_active', 0) or 0

        period = AcademicPeriods.objects.create(**validated_data)

        # Solo puede haber uno activo por universidad
        if period.is_active == 1:
            AcademicPeriods.objects.filter(
                university_id=selected_university_id,
                is_deleted=0,
            ).exclude(pk=period.pk).update(is_active=0)

        return period

    @transaction.atomic
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se activó, desactivar los demás
        if instance.is_active == 1:
            AcademicPeriods.objects.filter(
                university_id=instance.university_id,
                is_deleted=0,
            ).exclude(pk=instance.pk).update(is_active=0)

        return instance

