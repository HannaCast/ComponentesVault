from rest_framework import serializers

from careers.models.careers import Careers
from careers.models.groups import Groups
from universities.models.academic_periods import AcademicPeriods
from universities.models.shifts import Shifts
from universities.models.universities import Universities
from universities.serializers.academic_periods.academic_period_write_serializer import (
    _get_uses_period_groups,
)


class GroupWriteSerializer(serializers.ModelSerializer):
    career = serializers.PrimaryKeyRelatedField(
        queryset=Careers.objects.filter(is_deleted=0),
    )
    shift = serializers.PrimaryKeyRelatedField(
        queryset=Shifts.objects.filter(is_deleted=0),
    )
    academic_period = serializers.PrimaryKeyRelatedField(
        queryset=AcademicPeriods.objects.filter(is_deleted=0),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Groups
        fields = [
            'name',
            'career',
            'period_number',
            'letter',
            'shift',
            'academic_period',
            'status',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        uid = self.context.get('selected_university_id')
        if uid:
            self.fields['career'].queryset = Careers.objects.filter(
                is_deleted=0,
                university_id=uid,
            )
            self.fields['shift'].queryset = Shifts.objects.filter(
                is_deleted=0,
                university_id=uid,
            )
            self.fields['academic_period'].queryset = AcademicPeriods.objects.filter(
                is_deleted=0,
                university_id=uid,
            )

    def validate_letter(self, value):
        if len(value) != 1:
            raise serializers.ValidationError('La letra debe ser un solo carácter.')
        return value.upper()

    def validate_period_number(self, value):
        if value < 1:
            raise serializers.ValidationError('El número de período debe ser mayor a 0.')
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

        career = attrs.get('career') or getattr(self.instance, 'career', None)
        shift = attrs.get('shift') or getattr(self.instance, 'shift', None)
        academic_period = attrs.get('academic_period', serializers.empty)
        if academic_period is serializers.empty:
            academic_period = getattr(self.instance, 'academic_period', None)

        if career and career.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'career': 'La carrera no pertenece a la universidad seleccionada.'}
            )

        if shift and shift.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'shift': 'El turno no pertenece a la universidad seleccionada.'}
            )

        uses_period_groups = _get_uses_period_groups(selected_university_id)

        if not uses_period_groups:
            # No exigir que el cliente omita la clave: null, formularios y PUT
            # parcial suelen enviar academic_period; se normaliza a None.
            attrs['academic_period'] = None
        elif academic_period is not None and (
            academic_period.university_id != selected_university_id
        ):
            raise serializers.ValidationError(
                {
                    'academic_period': (
                        'El periodo académico no pertenece a la universidad seleccionada.'
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Groups.objects.create(**validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
