from rest_framework import serializers

from classrooms.models import Classrooms


class ClassroomSelectSerializer(serializers.ModelSerializer):
    classroom_type = serializers.CharField(source='classroom_type.name', read_only=True)

    class Meta:
        model = Classrooms
        fields = ['id', 'name', 'code', 'classroom_type']

