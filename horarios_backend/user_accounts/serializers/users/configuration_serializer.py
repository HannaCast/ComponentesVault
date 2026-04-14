from rest_framework import serializers

from user_accounts.models import UserConfiguration
from user_accounts.serializers.users.selected_university_serializer import SelectedUniversitySerializer
from universities.models.academic_periods import AcademicPeriods


class ConfigurationSerializer(serializers.ModelSerializer):
    # Compatibilidad con frontend actual: id del usuario autenticado.
    id = serializers.IntegerField(source='user.id', read_only=True)
    role_name = serializers.CharField(source='user.role.name', read_only=True)
    selected_university = SelectedUniversitySerializer(read_only=True)
    selected_university_active_period_name = serializers.SerializerMethodField()

    def get_selected_university_active_period_name(self, obj):
        selected_university = getattr(obj, 'selected_university', None)
        if not selected_university:
            return None

        if selected_university.uses_period_groups != 1:
            return None

        active_period = (
            AcademicPeriods.objects
            .filter(
                university_id=selected_university.id,
                is_active=1,
                is_deleted=0,
            )
            .order_by('-id')
            .first()
        )

        if not active_period:
            return None

        return active_period.name

    class Meta:
        model = UserConfiguration
        fields = [
            'id',
            'role_name',
            'selected_university',
            'selected_university_active_period_name',
            'theme',
            'accent',
            'schedule_generation',
            'status',
        ]
