from rest_framework import serializers

from universities.models.shifts import Shifts
from universities.models.universities import Universities


class ShiftWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shifts
        exclude = [
            'university',
            'is_deleted',
            'created_at',
            'created_by',
            'updated_at',
            'updated_by',
        ]
        # El cliente no envía status; se fija en create() (alta) y se conserva en update().
        read_only_fields = ('status',)

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        start = attrs.get('start_time')
        end = attrs.get('end_time')
        if self.instance is not None:
            if start is None:
                start = self.instance.start_time
            if end is None:
                end = self.instance.end_time

        if start is not None and end is not None and start >= end:
            raise serializers.ValidationError(
                {'end_time': 'La hora de fin debe ser posterior a la de inicio.'}
            )

        try:
            university = Universities.objects.get(
                pk=selected_university_id,
                is_deleted=0,
            )
        except Universities.DoesNotExist:
            raise serializers.ValidationError(
                {'university': 'La universidad seleccionada no existe.'}
            )

        u_start = university.start_time
        u_end = university.end_time
        if (
            u_start is not None
            and u_end is not None
            and start is not None
            and end is not None
            and (start < u_start or end > u_end)
        ):
            raise serializers.ValidationError(
                {
                    'non_field_errors': [
                        'El horario del turno debe estar dentro del rango '
                        f'operativo de la universidad ({u_start}–{u_end}).'
                    ],
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
        return Shifts.objects.create(**validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
