from django.db import models


class PeriodTypes(models.Model):
    name = models.CharField(max_length=45)
    code = models.CharField(max_length=45)
    months_duration = models.IntegerField()
    status = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'period_types'

