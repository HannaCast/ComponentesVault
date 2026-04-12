from rest_framework import serializers

from universities.models.universities import Universities


class SelectedUniversityUpdateSerializer(serializers.Serializer):
    selected_university_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_selected_university_id(self, value):
        if value is None:
            return value

        request = self.context.get('request')
        user = getattr(request, 'user', None)

        universities = Universities.objects.filter(
            id=value,
            status=1,
            is_deleted=0,
        )

        if user is not None and user.is_authenticated:
            universities = universities.filter(user=user)

        exists = universities.exists()
        if not exists:
            raise serializers.ValidationError(
                'Universidad no encontrada'
            )

        return value
