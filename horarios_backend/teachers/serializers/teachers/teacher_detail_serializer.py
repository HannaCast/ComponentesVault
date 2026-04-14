from rest_framework import serializers

from teachers.models import TeacherAvailabilities, Teachers, TeachersSubjects, TeachersUniversities


class TeacherAvailabilityBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherAvailabilities
        fields = ('id', 'day_of_week', 'start_time', 'end_time', 'is_available')


class TeacherDetailSerializer(serializers.ModelSerializer):
    """Serializador de detalle para Teachers (GET por ID)."""

    full_name = serializers.SerializerMethodField()
    require_classroom_display = serializers.SerializerMethodField()
    university_link_status = serializers.SerializerMethodField()

    class Meta:
        model = Teachers
        fields = (
            'id',
            'name',
            'surname',
            'last_name',
            'full_name',
            'require_classroom',
            'require_classroom_display',
            'status',
            'university_link_status',
        )

    def get_full_name(self, obj):
        parts = [obj.name, obj.surname]
        if obj.last_name:
            parts.append(obj.last_name)
        return ' '.join(parts)

    def get_require_classroom_display(self, obj):
        return 'Requiere salón' if obj.require_classroom == 1 else 'Tiene oficina'

    def get_university_link_status(self, obj):
        uid = self.context.get('selected_university_id')
        if not uid:
            return None
        link = (
            TeachersUniversities.objects.filter(
                teachers_id=obj.pk,
                universities_id=uid,
                is_deleted=0,
            ).first()
        )
        return link.status if link else None


class TeacherFullDetailSerializer(TeacherDetailSerializer):
    """Detalle para formulario: datos del profesor + disponibilidades + materias (universidad en contexto)."""

    availabilities = serializers.SerializerMethodField()
    subjects = serializers.SerializerMethodField()

    class Meta(TeacherDetailSerializer.Meta):
        fields = (*TeacherDetailSerializer.Meta.fields, 'availabilities', 'subjects')

    def get_availabilities(self, obj):
        qs = (
            TeacherAvailabilities.objects.filter(teacher_id=obj.pk, is_deleted=0)
            .order_by('day_of_week', 'start_time')
        )
        return TeacherAvailabilityBriefSerializer(qs, many=True).data

    def get_subjects(self, obj):
        uid = self.context.get('selected_university_id')
        if not uid:
            return []
        links = (
            TeachersSubjects.objects.filter(
                teachers_id=obj.pk,
                is_deleted=0,
                subjects__university_id=uid,
            )
            .select_related('subjects')
            .order_by('subjects__name', 'id')
        )
        return [
            {
                'subject_id': row.subjects_id,
                'name': row.subjects.name,
                'short_name': row.subjects.short_name,
            }
            for row in links
        ]
