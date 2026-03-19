from subjects.models import Subjects
from rest_framework import serializers

class SubjectListSerializer(serializers.ModelSerializer):
    color_name = serializers.CharField(source='color.name', read_only=True)

    class Meta:
        model = Subjects
        fields = [
            'id',
            'name',
            'short_name',
            'hours_per_week',
            'color_name',
            'status'
        ]