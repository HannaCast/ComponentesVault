from rest_framework import serializers
from careers.models import CareerSubjects
from subjects.models import Subjects

class SubjectDetailSerializer(serializers.ModelSerializer):
    color = serializers.StringRelatedField()
    color_id = serializers.IntegerField(source='color_id', read_only=True)
    careers = serializers.SerializerMethodField()

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
            'color_id',
            'is_mandatory',
            'status',
            'careers',
        )