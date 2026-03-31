from rest_framework import serializers
from teachers.models import TeacherAvailabilities, Teachers


class TeacherAvailabilityWriteSerializer(serializers.ModelSerializer):
    """Serializador de escritura para disponibilidades (POST, PUT)."""

    teacher = serializers.PrimaryKeyRelatedField(
        queryset=Teachers.objects.filter(is_deleted=0),
        help_text='ID del profesor (tabla teachers)',
    )
    day_of_week = serializers.IntegerField(
        min_value=1,
        max_value=7,
        help_text='1=Lunes … 7=Domingo',
    )
    is_available = serializers.IntegerField(
        min_value=0,
        max_value=1,
        help_text='1=disponible, 0=no disponible (ocupado)',
    )

    class Meta:
        model = TeacherAvailabilities
        fields = ('teacher', 'day_of_week', 'start_time', 'end_time', 'is_available')

    def _audit_user_label(self):
        """Etiqueta del usuario actual (email o id). Misma firma que en otros serializers de creación."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        return getattr(request.user, 'email', None) or str(request.user.pk)

    def validate(self, attrs):
        if self.instance:
            start = attrs.get('start_time', self.instance.start_time)
            end = attrs.get('end_time', self.instance.end_time)
        else:
            start = attrs['start_time']
            end = attrs['end_time']
        if start >= end:
            raise serializers.ValidationError(
                {'end_time': 'La hora de fin debe ser mayor que la hora de inicio.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data['is_deleted'] = 0
        return TeacherAvailabilities.objects.create(**validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
