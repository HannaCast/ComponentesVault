from rest_framework import serializers


class FullSetupSerializer(serializers.Serializer):
    university = serializers.DictField()
    modalities = serializers.ListField(child=serializers.DictField())
    academic_periods = serializers.ListField(required=False, child=serializers.DictField())
    shifts = serializers.ListField(child=serializers.DictField())

    def validate_modalities(self, value):
        if not value:
            raise serializers.ValidationError('Debe enviar al menos una modalidad.')
        return value