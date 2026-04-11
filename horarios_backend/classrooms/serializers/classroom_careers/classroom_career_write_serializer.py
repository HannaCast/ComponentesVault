from rest_framework import serializers

from careers.models import Careers
from classrooms.models import Classrooms


class ClassroomCareerWriteSerializer(serializers.Serializer):
    """Payload para crear/reactivar vínculo aula–carrera (misma universidad seleccionada)."""

    classrooms = serializers.IntegerField(min_value=1)
    careers = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        university_id = self.context.get('selected_university_id')
        if not university_id:
            raise serializers.ValidationError(
                {'universities': 'Debe tener una universidad seleccionada.'}
            )

        classroom_id = attrs['classrooms']
        career_id = attrs['careers']

        try:
            classroom = Classrooms.objects.get(
                pk=classroom_id,
                universities_id=university_id,
                is_deleted=0,
            )
        except Classrooms.DoesNotExist:
            raise serializers.ValidationError(
                {'classrooms': 'El aula no existe o no pertenece a la universidad seleccionada.'}
            )

        try:
            Careers.objects.get(
                pk=career_id,
                university_id=university_id,
                is_deleted=0,
            )
        except Careers.DoesNotExist:
            raise serializers.ValidationError(
                {'careers': 'La carrera no existe o no pertenece a la universidad seleccionada.'}
            )

        attrs['_classroom'] = classroom
        attrs['_career_id'] = career_id
        return attrs
