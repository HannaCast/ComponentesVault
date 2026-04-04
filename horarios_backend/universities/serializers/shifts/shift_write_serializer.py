from rest_framework import serializers
from universities.models.shifts import Shifts


class ShiftWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shifts
        exclude = [
            'university',
            'is_deleted',
            'created_at',
            'created_by',
            'updated_at',
            'updated_by',
        ]

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        validated_data['university_id'] = selected_university_id
        validated_data['is_deleted'] = 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class ShiftListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shifts
        fields = ['id', 'name', 'order', 'start_time', 'end_time', 'status']


class ShiftDetailSerializer(serializers.ModelSerializer):
    university_id = serializers.IntegerField(source='university.id', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = Shifts
        fields = [
            'id',
            'name',
            'order',
            'start_time',
            'end_time',
            'status',
            'university_id',
            'university_name',
        ]