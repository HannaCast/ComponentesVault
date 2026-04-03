from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirmation = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context.get('user')
        old_password = attrs.get('old_password')
        new_password = attrs.get('new_password')
        new_password_confirmation = attrs.get('new_password_confirmation')

        if user is None:
            raise serializers.ValidationError('No fue posible validar el usuario autenticado')

        if not user.check_password(old_password):
            raise serializers.ValidationError(
                {'old_password': ['La contraseña actual es incorrecta']}
            )

        if new_password != new_password_confirmation:
            raise serializers.ValidationError(
                {'new_password_confirmation': ['La confirmación no coincide con la nueva contraseña']}
            )

        if old_password == new_password:
            raise serializers.ValidationError(
                {'new_password': ['La nueva contraseña debe ser diferente a la actual']}
            )

        try:
            validate_password(password=new_password, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'new_password': list(exc.messages)})

        return attrs