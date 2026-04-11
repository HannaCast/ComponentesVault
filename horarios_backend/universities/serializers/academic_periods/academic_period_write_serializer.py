from django.db import connection, transaction
from rest_framework import serializers

from universities.models import AcademicPeriods, Universities


def _get_uses_period_groups(university_id: int) -> bool:
    """
    No se lee desde el modelo Universities porque este repositorio puede no
    tener el campo mapeado. Se consulta directo a BD si la columna existe.
    """
    with connection.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM universities LIKE 'uses_period_groups'")
        if cursor.fetchone() is None:
            return False

        cursor.execute(
            "SELECT uses_period_groups FROM universities WHERE id = %s LIMIT 1",
            [university_id],
        )
        row = cursor.fetchone()
        if not row:
            return False
        return int(row[0] or 0) == 1


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

    def validate_start_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError('Debe estar entre 1 y 12.')
        return value

    def validate_end_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError('Debe estar entre 1 y 12.')
        return value

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        if not Universities.objects.filter(id=selected_university_id).exists():
            raise serializers.ValidationError(
                {'university': 'La universidad seleccionada no existe.'}
            )

        uses_period_groups = _get_uses_period_groups(selected_university_id)

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
        else:
            if year is not None or order is not None:
                raise serializers.ValidationError(
                    {
                        'order': (
                            'Los campos order/year solo deben enviarse cuando '
                            'uses_period_groups = True.'
                        )
                    }
                )

        # No permitir duplicados de order dentro de la misma universidad
        if uses_period_groups and order is not None:
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

        # Validar rango de is_active (si viene)
        is_active = attrs.get('is_active')
        if is_active is not None and is_active not in (0, 1):
            raise serializers.ValidationError(
                {'is_active': 'Debe ser 0 o 1.'}
            )

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

