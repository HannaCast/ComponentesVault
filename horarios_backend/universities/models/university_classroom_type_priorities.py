from django.db import models

from classrooms.models.classroom_types import ClassroomTypes
from universities.models.universities import Universities


class UniversityClassroomTypePriorities(models.Model):
    university = models.ForeignKey(Universities, models.DO_NOTHING)
    classroom_type = models.ForeignKey(ClassroomTypes, models.DO_NOTHING)
    priority = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'university_classroom_type_priorities'
