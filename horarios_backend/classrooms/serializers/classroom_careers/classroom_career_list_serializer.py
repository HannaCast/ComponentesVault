from rest_framework import serializers

from classrooms.models import ClassroomCareers


class ClassroomCareerListSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classrooms.name', read_only=True)
    career_name = serializers.CharField(source='careers.name', read_only=True)

    class Meta:
        model = ClassroomCareers
        fields = ['id', 'classrooms', 'classroom_name', 'careers', 'career_name']
