from rest_framework import serializers

from universities.models import UniversityClassroomTypePriorities


class UniversityClassroomTypePriorityListSerializer(serializers.ModelSerializer):
    university_id = serializers.IntegerField(source='university.id', read_only=True)
    classroom_type_id = serializers.IntegerField(source='classroom_type.id', read_only=True)
    classroom_type_name = serializers.CharField(source='classroom_type.name', read_only=True)

    class Meta:
        model = UniversityClassroomTypePriorities
        fields = [
            'id',
            'university_id',
            'classroom_type_id',
            'classroom_type_name',
            'priority',
        ]
