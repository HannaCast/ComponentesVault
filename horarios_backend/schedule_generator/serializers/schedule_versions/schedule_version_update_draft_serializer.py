from rest_framework import serializers


class ScheduleVersionUpdateDraftSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=100, required=False, allow_blank=False)
    academic_period_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    parameters = serializers.JSONField(required=False)
    data = serializers.JSONField(required=False)
    assigned_count = serializers.IntegerField(required=False, min_value=0)
    unassigned_count = serializers.IntegerField(required=False, min_value=0)

    def validate_label(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('El label no puede estar vacío.')
        return cleaned

    def validate_parameters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('parameters debe ser un objeto JSON.')
        return value

    def validate_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('data debe ser un objeto JSON.')
        return value

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('Debe enviar al menos un campo para actualizar el borrador.')
        return attrs
