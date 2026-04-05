from rest_framework import serializers


class ScheduleVersionGenerateSerializer(serializers.Serializer):
    label = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=False,
    )
    parameters = serializers.JSONField(required=False, default=dict)
    is_confirmed = serializers.HiddenField(default=0)
    is_deleted = serializers.HiddenField(default=0)

    def validate_label(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('El label no puede estar vacío.')
        return cleaned

    def validate_parameters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('parameters debe ser un objeto JSON.')
        return value
