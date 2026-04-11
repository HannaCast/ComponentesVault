from django.db import models
from careers.models.careers import Careers
from subjects.models import Subjects


class CareerSubjects(models.Model):
    subjects = models.ForeignKey(Subjects, models.DO_NOTHING)
    careers = models.ForeignKey(Careers, models.DO_NOTHING)
    period_number = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'career_subjects'
