from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User
from universities.models.universities import Universities

class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        """ Agrega campos personalizados al payload del JWT """
        token = super().get_token(user)
        # Datos útiles que irán dentro del JWT
        token['id'] = user.id
        token['role'] = user.role.name if user.role else None
        return token

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['name', 'surname', 'last_name', 'email', 'password', 'role']

    def create(self, validated_data):
        """ Crea un nuevo usuario usando el manager personalizado """
        return User.objects.create_user(**validated_data)


class SelectedUniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Universities
        fields = ['id', 'name', 'short_name', 'institution_code']


class MeInfoSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role']


class ConfigurationSerializer(serializers.ModelSerializer):
    selected_university = SelectedUniversitySerializer(read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'role_name', 'selected_university']