from careers.models import Modalities
from rest_framework import serializers

class ModalitiesWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modalities
        fields = [
            'name',
            'require_classroom',
            'configurations',
        ]

    def create(self, validated_data):
        """ Crea una modalidad con status activo por defecto """
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        return Modalities.objects.create(**validated_data)
