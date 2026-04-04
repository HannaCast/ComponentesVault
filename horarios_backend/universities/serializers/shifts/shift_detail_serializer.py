from rest_framework import serializers

from universities.models.shifts import Shifts


class ShiftDetailSerializer(serializers.ModelSerializer):
    university_id = serializers.IntegerField(source='university.id', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = Shifts
        fields = [
            'id',
            'name',
            'order',
            'start_time',
            'end_time',
            'status',
            'university_id',
            'university_name',
        ]
