from rest_framework import serializers
from careers.models import CareerSubjects
from subjects.models import Subjects
from teachers.models import TeachersSubjects

class SubjectDetailSerializer(serializers.ModelSerializer):
    color = serializers.CharField(source='color.name', read_only=True)
    color_hex = serializers.CharField(source='color.hex', read_only=True)
    color_id = serializers.IntegerField(read_only=True)
    careers = serializers.SerializerMethodField()
    teachers = serializers.SerializerMethodField()

    def get_careers(self, obj):
        queryset = CareerSubjects.objects.filter(
            subjects=obj,
            is_deleted=0,
        ).select_related('careers').order_by('careers_id', 'period_number', 'id')

        return [
            {
                'id': row.careers_id,
                'name': row.careers.name,
                'period_number': row.period_number,
            }
            for row in queryset
        ]

    def get_teachers(self, obj):
        queryset = TeachersSubjects.objects.filter(
            subjects=obj,
            is_deleted=0,
            teachers__is_deleted=0,
        ).select_related('teachers').order_by('teachers_id', 'id')

        rows = []
        for row in queryset:
            parts = [row.teachers.name, row.teachers.surname]
            if row.teachers.last_name:
                parts.append(row.teachers.last_name)

            rows.append(
                {
                    'id': row.teachers_id,
                    'full_name': ' '.join(parts),
                }
            )

        return rows

    class Meta:
        model = Subjects
        fields = (
            'id',
            'name',
            'short_name',
            'code',
            'description',
            'hours_per_week',
            'color',
            'color_hex',
            'color_id',
            'is_mandatory',
            'status',
            'created_at',
            'updated_at',
            'careers',
            'teachers',
        )