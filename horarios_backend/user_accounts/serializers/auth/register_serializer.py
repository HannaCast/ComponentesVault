from rest_framework import serializers

from user_accounts.models import Role, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['name', 'surname', 'last_name', 'email', 'password']

    def create(self, validated_data):
        """Crea un usuario asignando el rol objetivo indicado en el contexto."""
        target_role_name = self.context.get('target_role_name', 'usuario')
        role = Role.objects.filter(name=target_role_name).first()
        if not role:
            raise serializers.ValidationError(
                {'role': f"No existe el rol requerido: {target_role_name}"}
            )

        return User.objects.create_user(role=role, **validated_data)
