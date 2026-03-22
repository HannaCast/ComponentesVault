from rest_framework import serializers

from universities.models.universities import Universities


class SelectedUniversityUpdateSerializer(serializers.Serializer):
    selected_university_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_selected_university_id(self, value):
        if value is None:
            return value

        exists = Universities.objects.filter(id=value, is_deleted=0).exists()
        if not exists:
            raise serializers.ValidationError('La universidad seleccionada no existe o fue eliminada')

        return value
