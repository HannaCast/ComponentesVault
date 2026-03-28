from django.utils import timezone
from rest_framework import serializers
from teachers.models import Teachers


class TeacherWriteSerializer(serializers.ModelSerializer):
    """Serializador de escritura para Teachers (POST, PUT)"""

    require_classroom = serializers.IntegerField(
        min_value=0,
        max_value=1,
        help_text='0 = no requiere salón (tiene oficina), 1 = requiere salón',
    )

    class Meta:
        model = Teachers
        fields = ('name', 'surname', 'last_name', 'require_classroom')

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('El nombre no puede estar vacío.')
        return value.strip()

    def validate_surname(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('El apellido paterno no puede estar vacío.')
        return value.strip()

    def validate_last_name(self, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        return value.strip()

    def _audit_user_label(self):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        return getattr(request.user, 'email', None) or str(request.user.pk)

    def create(self, validated_data):
        now = timezone.now()
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        validated_data['created_at'] = now
        validated_data['updated_at'] = now
        label = self._audit_user_label()
        if label:
            validated_data['created_by'] = label
            validated_data['updated_by'] = label
        return Teachers.objects.create(**validated_data)

    def update(self, instance, validated_data):
        now = timezone.now()
        validated_data['updated_at'] = now
        label = self._audit_user_label()
        if label:
            validated_data['updated_by'] = label
        return super().update(instance, validated_data)
