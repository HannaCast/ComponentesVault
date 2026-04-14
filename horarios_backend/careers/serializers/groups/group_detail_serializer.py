from rest_framework import serializers

from careers.models.groups import Groups


class GroupDetailSerializer(serializers.ModelSerializer):
    career_id = serializers.IntegerField(source='career.id', read_only=True)
    career_name = serializers.CharField(source='career.name', read_only=True)

    shift_id = serializers.IntegerField(source='shift.id', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)

    academic_period_id = serializers.SerializerMethodField()
    academic_period_name = serializers.SerializerMethodField()

    university_id = serializers.IntegerField(source='university.id', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)

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
            'academic_period_id',
            'academic_period_name',
            'university_id',
            'university_name',
            'created_at',
            'updated_at',
        ]

    def get_academic_period_id(self, obj):
        return obj.academic_period_id

    def get_academic_period_name(self, obj):
        if obj.academic_period_id is None:
            return None
        return obj.academic_period.name
