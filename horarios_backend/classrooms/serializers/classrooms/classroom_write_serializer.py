from rest_framework import serializers

from classrooms.models import Classrooms


class ClassroomWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classrooms
        fields = [
            'name',
            'classroom_type',
            'code',
            'floor',
            'building',
            'building_code',
            'is_restricted',
        ]

    def validate_is_restricted(self, value):
        if value not in (0, 1):
            raise serializers.ValidationError('Debe ser 0 o 1.')
        return value

    def validate_classroom_type(self, classroom_type):
        if classroom_type.is_deleted != 0 or classroom_type.status != 1:
            raise serializers.ValidationError('El tipo de aula no existe o no está disponible.')
        return classroom_type

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'universities': 'Debe tener una universidad seleccionada primero'}
            )

        validated_data['universities_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        validated_data['is_restricted'] = validated_data.get('is_restricted', 0) or 0
        return Classrooms.objects.create(**validated_data)

