from rest_framework import serializers

from universities.models import AcademicPeriods


class AcademicPeriodDetailSerializer(serializers.ModelSerializer):
    university = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = AcademicPeriods
        fields = (
            'id',
            'name',
            'start_month',
            'end_month',
            'year',
            'order',
            'is_active',
            'university',
        )

