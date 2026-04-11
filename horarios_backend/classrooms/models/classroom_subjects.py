from django.db import models

from classrooms.models.classrooms import Classrooms
from subjects.models.subjects import Subjects


class ClassroomSubjects(models.Model):
    subject = models.ForeignKey(Subjects, models.DO_NOTHING)
    classroom = models.ForeignKey(Classrooms, models.DO_NOTHING)
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'classroom_subjects'

