from django.db import models
from universities.models.universities import Universities

class AcademicPeriods(models.Model):
    name = models.CharField(max_length=50)
    university = models.ForeignKey(Universities, models.DO_NOTHING)
    start_month = models.IntegerField()
    end_month = models.IntegerField()
    year = models.IntegerField(blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'academic_periods'

