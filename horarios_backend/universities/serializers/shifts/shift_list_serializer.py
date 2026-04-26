from rest_framework import serializers

from universities.models.shifts import Shifts


class ShiftListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shifts
        fields = ['id', 'name', 'start_time', 'end_time', 'status']
