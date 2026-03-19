from subjects.models import Subjects
from rest_framework import serializers
from django.utils import timezone

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
            'status'
        ]

    def validate_hours_per_week(self, value):
        if value <= 0:
            raise serializers.ValidationError("Debe ser mayor a 0")
        return value

    def create(self, validated_data):
        validated_data['created_at'] = timezone.now()
        validated_data['is_deleted'] = 0
        return super().create(validated_data)