from rest_framework import serializers
from careers.models import Careers


class CareerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Careers
        fields = [
            'name',
            'short_name',
            'code',
            'modality',
            'total_periods',
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

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Careers.objects.create(**validated_data)
