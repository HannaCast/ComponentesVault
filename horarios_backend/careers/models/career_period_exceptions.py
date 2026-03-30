from django.db import models
from careers.models.careers import Careers


class CareerPeriodExceptions(models.Model):
    career = models.ForeignKey(Careers, models.DO_NOTHING)
    period_number = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True, null=True)
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'career_period_exceptions'
