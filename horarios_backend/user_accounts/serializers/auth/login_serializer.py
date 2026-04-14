from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if getattr(user, 'status', 0) != 1:
            raise AuthenticationFailed('La cuenta esta inactiva')

        if getattr(user, 'is_verificated', 0) != 1:
            raise AuthenticationFailed('La cuenta no ha sido verificada')

        return data

    @classmethod
    def get_token(cls, user):
        """Agrega campos personalizados al payload del JWT."""
        token = super().get_token(user)
        token['id'] = user.id
        token['role'] = user.role.name if user.role else None
        return token
