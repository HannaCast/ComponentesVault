from rest_framework import serializers

from careers.models.careers import Careers
from careers.models.groups import Groups
from universities.models.academic_periods import AcademicPeriods
from universities.models.shifts import Shifts
from universities.models.universities import Universities


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
        extra_kwargs = {
            # No exigir en POST/PUT: create() asigna activo; activar/desactivar vía toggle-status.
            'status': {'read_only': True},
        }

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

        university = Universities.objects.only(
            'id',
            'uses_period_groups',
        ).filter(id=selected_university_id).first()

        if university is None:
            raise serializers.ValidationError(
                {'university': 'La universidad seleccionada no existe.'}
            )

        career = attrs.get('career') or getattr(self.instance, 'career', None)
        shift = attrs.get('shift') or getattr(self.instance, 'shift', None)
        if career and career.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'career': 'La carrera no pertenece a la universidad seleccionada.'}
            )

        if shift and shift.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'shift': 'El turno no pertenece a la universidad seleccionada.'}
            )

        uses_period_groups = int(university.uses_period_groups or 0) == 1

        # Si la universidad no usa periodos para grupos, no exigir ni persistir academic_period.
        if not uses_period_groups:
            # No exigir que el cliente omita la clave: null, formularios y PUT
            # parcial suelen enviar academic_period; se normaliza a None.
            attrs['academic_period'] = None
        else:
            active_period = AcademicPeriods.objects.filter(
                university_id=selected_university_id,
                is_deleted=0,
                is_active=1,
            ).order_by('id').first()

            if active_period is None:
                raise serializers.ValidationError(
                    {
                        'academic_period': (
                            'No existe un periodo académico activo para la universidad seleccionada.'
                        )
                    }
                )

            # Cuando la universidad usa periodos, siempre se persiste el periodo activo.
            attrs['academic_period'] = active_period

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
