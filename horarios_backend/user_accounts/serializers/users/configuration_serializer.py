from rest_framework import serializers

from user_accounts.models import UserConfiguration
from user_accounts.serializers.users.selected_university_serializer import SelectedUniversitySerializer


class ConfigurationSerializer(serializers.ModelSerializer):
    # Compatibilidad con frontend actual: id del usuario autenticado.
    id = serializers.IntegerField(source='user.id', read_only=True)
    role_name = serializers.CharField(source='user.role.name', read_only=True)
    selected_university = SelectedUniversitySerializer(read_only=True)

    class Meta:
        model = UserConfiguration
        fields = [
            'id',
            'role_name',
            'selected_university',
            'theme',
            'accent',
            'status',
        ]
