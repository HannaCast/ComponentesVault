from subjects.models import Subjects
from rest_framework import serializers

class SubjectListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Subjects
        fields = [
            'id',
            'name',
            'short_name',
            'hours_per_week',
            'code',
            'status'
        ]