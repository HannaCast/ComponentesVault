from rest_framework import serializers

from universities.models.universities import Universities


class SelectedUniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Universities
        fields = ['id', 'name', 'short_name', 'institution_code']
