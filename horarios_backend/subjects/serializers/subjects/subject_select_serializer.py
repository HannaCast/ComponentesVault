from subjects.models import Subjects
from rest_framework import serializers

class SubjectSelectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subjects
        fields = ['id', 'name']