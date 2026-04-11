from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    """ Autentica usando el header Authorization o la cookie access_token. """

    @staticmethod
    def _ensure_user_is_active_and_verified(user):
        if getattr(user, 'status', 0) != 1:
            raise AuthenticationFailed('La cuenta esta inactiva')

        if getattr(user, 'is_verificated', 0) != 1:
            raise AuthenticationFailed('La cuenta no ha sido verificada')

    def authenticate(self, request):
        header = self.get_header(request)

        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            raw_token = request.COOKIES.get('access_token')

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        self._ensure_user_is_active_and_verified(user)
        return user, validated_token
