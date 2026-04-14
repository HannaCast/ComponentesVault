from django.db import models

from classrooms.models.classroom_types import ClassroomTypes
from subjects.models.subjects import Subjects


class SubjectsClassroomTypes(models.Model):
    subject = models.ForeignKey(Subjects, models.DO_NOTHING)
    classroom_type = models.ForeignKey(ClassroomTypes, models.DO_NOTHING)
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'subjects_classroom_types'
