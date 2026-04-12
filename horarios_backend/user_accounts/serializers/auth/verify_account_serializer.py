from rest_framework import serializers


class VerifyAccountSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=64)
