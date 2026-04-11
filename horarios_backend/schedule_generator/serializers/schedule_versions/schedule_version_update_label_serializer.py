from rest_framework import serializers


class ScheduleVersionUpdateLabelSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=100, allow_blank=False)

    def validate_label(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('El label no puede estar vacío.')
        return cleaned
