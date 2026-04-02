from rest_framework import serializers
from careers.models.groups import Groups


class GroupWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groups
        exclude = [
            'is_deleted',
            'university',
            'created_at',
            'created_by',
            'updated_at',
            'updated_by',
        ]


    def validate_letter(self, value):
        if len(value) != 1:
            raise serializers.ValidationError('La letra debe ser un solo carácter.')
        return value.upper()

    def validate_period_number(self, value):
        if value < 1:
            raise serializers.ValidationError('El número de período debe ser mayor a 0.')
        return value

    def create(self, validated_data):
        selected_university_id = self.context.get('selected_university_id')
        validated_data['university_id'] = selected_university_id
        validated_data['is_deleted'] = 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
  


class GroupListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groups
        fields = [
            'name',
            'period_number',
            'letter',
            'status',
        ]
        
class GroupDetailSerializer(serializers.ModelSerializer):
    career_id = serializers.IntegerField(source='career.id', read_only=True)
    career_name = serializers.CharField(source='career.name', read_only=True)

    shift_id = serializers.IntegerField(source='shift.id', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)

    academic_period_id = serializers.IntegerField(source='academic_period.id', read_only=True)
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)

    university_id = serializers.IntegerField(source='university.id', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = Groups
        fields = [
            'id',
            'name',
            'period_number',
            'letter',
            'status',
            'career_id',
            'career_name',
            'shift_id',
            'shift_name',
            'academic_period_id',
            'academic_period_name',
            'university_id',
            'university_name',
            
        ]
