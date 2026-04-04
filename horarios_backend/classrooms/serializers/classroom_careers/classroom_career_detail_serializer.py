from rest_framework import serializers

from classrooms.models import ClassroomCareers


class ClassroomCareerDetailSerializer(serializers.ModelSerializer):
    classrooms = serializers.SerializerMethodField()
    careers = serializers.SerializerMethodField()

    class Meta:
        model = ClassroomCareers
        fields = (
            'id',
            'classrooms',
            'careers',
        )

    def get_classrooms(self, obj):
        return {
            'id': obj.classrooms_id,
            'name': obj.classrooms.name,
            'code': obj.classrooms.code,
        }

    def get_careers(self, obj):
        return {
            'id': obj.careers_id,
            'name': obj.careers.name,
            'short_name': obj.careers.short_name,
        }
