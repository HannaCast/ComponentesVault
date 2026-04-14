from rest_framework import serializers
from careers.models import CareerSubjects


class CareerSubjectListSerializer(serializers.ModelSerializer):
    careers = serializers.CharField(source='careers.name', read_only=True)
    subjects = serializers.CharField(source='subjects.name', read_only=True)

    class Meta:
        model = CareerSubjects
        fields = ['id', 'subjects', 'careers', 'period_number']
