from rest_framework import serializers

from classrooms.models import ClassroomCareers, ClassroomSubjects, Classrooms


class ClassroomDetailSerializer(serializers.ModelSerializer):
    classroom_type = serializers.CharField(source='classroom_type.name', read_only=True)
    careers = serializers.SerializerMethodField()
    subjects = serializers.SerializerMethodField()

    def get_careers(self, obj):
        queryset = ClassroomCareers.objects.filter(
            classrooms=obj,
            is_deleted=0,
            careers__is_deleted=0,
        ).select_related('careers').order_by('careers_id', 'id')

        return [
            {
                'id': row.careers_id,
                'name': row.careers.name,
                'short_name': row.careers.short_name,
            }
            for row in queryset
        ]

    def get_subjects(self, obj):
        queryset = ClassroomSubjects.objects.filter(
            classroom=obj,
            is_deleted=0,
            subject__is_deleted=0,
        ).select_related('subject').order_by('subject_id', 'id')

        return [
            {
                'id': row.subject_id,
                'name': row.subject.name,
                'code': row.subject.code,
            }
            for row in queryset
        ]

    class Meta:
        model = Classrooms
        fields = (
            'id',
            'name',
            'code',
            'floor',
            'classroom_type',
            'building',
            'building_code',
            'is_restricted',
            'is_restricted_to_subjects',
            'careers',
            'subjects',
            'status',
        )

