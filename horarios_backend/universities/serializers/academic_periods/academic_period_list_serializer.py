from rest_framework import serializers

from universities.models import AcademicPeriods


class AcademicPeriodListSerializer(serializers.ModelSerializer):
    university = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = AcademicPeriods
        fields = [
            'id',
            'name',
            'start_date',
            'end_date',
            'year',
            'order',
            'is_active',
            'university',
        ]

