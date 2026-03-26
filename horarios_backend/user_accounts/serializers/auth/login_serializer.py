from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        """Agrega campos personalizados al payload del JWT."""
        token = super().get_token(user)
        token['id'] = user.id
        token['role'] = user.role.name if user.role else None
        return token
