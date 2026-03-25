from rest_framework import serializers
from teachers.models import Teachers


class TeacherWriteSerializer(serializers.ModelSerializer):
    """Serializador de escritura para Teachers (POST, PUT)"""

    required_classroom = serializers.IntegerField(
        min_value=0,
        max_value=1,
        help_text='0 = no requiere salón (tiene oficina), 1 = requiere salón'
    )

    class Meta:
        model = Teachers
        fields = ('name', 'first_name', 'last_name', 'required_classroom')

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('El nombre no puede estar vacío.')
        return value.strip()

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('El apellido paterno no puede estar vacío.')
        return value.strip()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('El apellido materno no puede estar vacío.')
        return value.strip()

    def create(self, validated_data):
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Teachers.objects.create(**validated_data)
