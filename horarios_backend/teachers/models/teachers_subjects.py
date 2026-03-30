from django.db import models
from subjects.models import Subjects
from teachers.models.teachers import Teachers


class TeachersSubjects(models.Model):
    teachers = models.ForeignKey(Teachers, models.DO_NOTHING)
    subjects = models.ForeignKey(Subjects, models.DO_NOTHING)
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'teachers_subjects'
