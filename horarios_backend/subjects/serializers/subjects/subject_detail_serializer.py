from subjects.models import Subjects
from rest_framework import serializers

class SubjectDetailSerializer(serializers.ModelSerializer):
    color = serializers.StringRelatedField()

    class Meta:
        model = Subjects
        fields = '__all__'