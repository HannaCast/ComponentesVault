from rest_framework import serializers

from classrooms.models import ClassroomTypes
from universities.models import Universities, UniversityClassroomTypePriorities


class UniversityClassroomTypePriorityWriteSerializer(serializers.ModelSerializer):
    classroom_type_id = serializers.IntegerField(required=False)

    class Meta:
        model = UniversityClassroomTypePriorities
        fields = ['classroom_type_id', 'priority']

    def validate_priority(self, value):
        if int(value) < 1:
            raise serializers.ValidationError('La prioridad debe ser mayor o igual a 1.')
        return int(value)

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        if not Universities.objects.filter(
            id=selected_university_id,
            is_deleted=0,
            status=1,
        ).exists():
            raise serializers.ValidationError(
                {'university': 'La universidad seleccionada no existe o no esta activa.'}
            )

        classroom_type_id = attrs.get('classroom_type_id')
        if classroom_type_id is None and self.instance is not None:
            classroom_type_id = self.instance.classroom_type_id

        if classroom_type_id is None:
            raise serializers.ValidationError(
                {'classroom_type_id': 'Este campo es obligatorio.'}
            )

        if not ClassroomTypes.objects.filter(
            id=classroom_type_id,
            is_deleted=0,
            status=1,
        ).exists():
            raise serializers.ValidationError(
                {'classroom_type_id': 'El tipo de aula no existe o no esta disponible.'}
            )

        existing = UniversityClassroomTypePriorities.objects.filter(
            university_id=selected_university_id,
            classroom_type_id=classroom_type_id,
            is_deleted=0,
        )
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                {'classroom_type_id': 'Ya existe una configuracion activa para ese tipo de aula.'}
            )

        attrs['_resolved_classroom_type_id'] = int(classroom_type_id)
        return attrs

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        classroom_type_id = validated_data.pop('_resolved_classroom_type_id')
        validated_data.pop('classroom_type_id', None)

        soft_deleted = UniversityClassroomTypePriorities.objects.filter(
            university_id=selected_university_id,
            classroom_type_id=classroom_type_id,
            is_deleted=1,
        ).order_by('-id').first()

        if soft_deleted:
            soft_deleted.priority = validated_data['priority']
            soft_deleted.is_deleted = 0
            soft_deleted.save(update_fields=['priority', 'is_deleted'])
            return soft_deleted

        return UniversityClassroomTypePriorities.objects.create(
            university_id=selected_university_id,
            classroom_type_id=classroom_type_id,
            is_deleted=0,
            **validated_data,
        )

    def update(self, instance, validated_data):
        classroom_type_id = validated_data.pop(
            '_resolved_classroom_type_id',
            instance.classroom_type_id,
        )
        validated_data.pop('classroom_type_id', None)

        instance.classroom_type_id = classroom_type_id
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
