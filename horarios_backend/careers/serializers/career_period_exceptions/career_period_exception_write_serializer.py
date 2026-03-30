from rest_framework import serializers
from careers.models import CareerPeriodExceptions, Careers


class CareerPeriodExceptionWriteSerializer(serializers.ModelSerializer):
    career = serializers.PrimaryKeyRelatedField(
        queryset=Careers.objects.filter(is_deleted=0),
    )

    class Meta:
        model = CareerPeriodExceptions
        fields = ['career', 'period_number', 'reason']

    def validate(self, attrs):
        selected_university_id = self.context.get('selected_university_id')
        if not selected_university_id:
            raise serializers.ValidationError(
                {'university': 'Debe tener una universidad seleccionada primero'}
            )

        career = attrs.get('career') or getattr(self.instance, 'career', None)
        if career and career.university_id != selected_university_id:
            raise serializers.ValidationError(
                {'career': 'La carrera no pertenece a la universidad seleccionada.'}
            )

        return attrs

    def validate_period_number(self, value):
        if value <= 0:
            raise serializers.ValidationError('Debe ser mayor a 0')
        return value

    def create(self, validated_data):
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return CareerPeriodExceptions.objects.create(**validated_data)
