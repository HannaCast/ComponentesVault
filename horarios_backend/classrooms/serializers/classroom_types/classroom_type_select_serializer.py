from rest_framework import serializers

from classrooms.models import ClassroomTypes


class ClassroomTypeSelectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassroomTypes
        fields = ['id', 'name']

