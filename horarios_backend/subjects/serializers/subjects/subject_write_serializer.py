from subjects.models import Subjects
from rest_framework import serializers

class SubjectWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Subjects
        fields = [
            'name',
            'short_name',
            'code',
            'description',
            'hours_per_week',
            'color',
            'is_mandatory',
        ]

    def validate_hours_per_week(self, value):
        if value <= 0:
            raise serializers.ValidationError("Debe ser mayor a 0")
        return value

    def create(self, validated_data):
        """ Crea una materia con status activo por defecto """
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        validated_data['is_mandatory'] = validated_data.get('is_mandatory', 1)
        validated_data['university_id'] = selected_university_id
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Subjects.objects.create(**validated_data)