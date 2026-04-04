from rest_framework import serializers
from universities.models import Universities

class UniversityWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Universities
        fields = ('name', 'short_name', 'institution_code', 'image', 'start_time', 'end_time', 'uses_period_groups')

    def create(self, validated_data):
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Universities.objects.create(**validated_data)
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError(
            "La hora de inicio debe ser menor que la hora de fin"
        )
        return data


