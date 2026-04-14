from rest_framework import serializers

from careers.models.groups import Groups


class GroupListSerializer(serializers.ModelSerializer):
    career_id = serializers.IntegerField(source='career.id', read_only=True)
    career_name = serializers.CharField(source='career.name', read_only=True)
    shift_id = serializers.IntegerField(source='shift.id', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)

    class Meta:
        model = Groups
        fields = [
            'id',
            'name',
            'period_number',
            'letter',
            'status',
            'career_id',
            'career_name',
            'shift_id',
            'shift_name',
        ]
