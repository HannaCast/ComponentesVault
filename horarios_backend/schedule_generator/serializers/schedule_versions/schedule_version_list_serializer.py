from rest_framework import serializers

from schedule_generator.models import ScheduleVersions


class ScheduleVersionListSerializer(serializers.ModelSerializer):
    academic_period = serializers.SerializerMethodField()

    class Meta:
        model = ScheduleVersions
        fields = [
            'id',
            'label',
            'academic_period',
            'assigned_count',
            'unassigned_count',
            'is_confirmed',
            'confirmed_at',
            'created_at',
            'updated_at',
        ]

    def get_academic_period(self, obj):
        if not obj.academic_period:
            return None

        return {
            'id': obj.academic_period_id,
            'name': obj.academic_period.name,
            'year': obj.academic_period.year,
            'order': obj.academic_period.order,
        }
