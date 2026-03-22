from rest_framework import serializers

from user_accounts.models import User


class MeInfoSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role']
