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
            'status'
        ]

    def validate_hours_per_week(self, value):
        if value <= 0:
            raise serializers.ValidationError("Debe ser mayor a 0")
        return value

    def create(self, validated_data):
        """ Crea una materia con status activo por defecto """
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Subjects.objects.create(**validated_data)