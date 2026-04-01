from django.db import models

from classrooms.models.classroom_types import ClassroomTypes
from universities.models.universities import Universities


class Classrooms(models.Model):
    name = models.CharField(max_length=100)
    classroom_type = models.ForeignKey(ClassroomTypes, models.DO_NOTHING)
    code = models.CharField(max_length=20, blank=True, null=True)
    floor = models.IntegerField(blank=True, null=True)
    building = models.CharField(max_length=50, blank=True, null=True)
    building_code = models.CharField(max_length=20, blank=True, null=True)
    universities = models.ForeignKey(Universities, models.DO_NOTHING)
    is_restricted = models.IntegerField()
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'classrooms'

