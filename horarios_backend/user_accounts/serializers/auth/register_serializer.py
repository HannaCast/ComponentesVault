from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from user_accounts.models import Role, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['name', 'surname', 'last_name', 'email', 'password']

    def validate(self, attrs):
        candidate_user = User(
            email=attrs.get('email', ''),
            name=attrs.get('name', ''),
            surname=attrs.get('surname', ''),
            last_name=attrs.get('last_name'),
        )

        try:
            validate_password(password=attrs.get('password'), user=candidate_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})

        return attrs

    def create(self, validated_data):
        """Crea un usuario asignando el rol objetivo indicado en el contexto."""
        target_role_name = self.context.get('target_role_name', 'usuario')
        role = Role.objects.filter(name=target_role_name).first()
        if not role:
            raise serializers.ValidationError(
                {'role': f"No existe el rol requerido: {target_role_name}"}
            )

        return User.objects.create_user(role=role, **validated_data)
