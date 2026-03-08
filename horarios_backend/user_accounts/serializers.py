from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

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