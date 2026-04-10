from django.db import models

from universities.models import AcademicPeriods, Universities


class ScheduleVersions(models.Model):
    id = models.BigAutoField(primary_key=True)
    label = models.CharField(max_length=100)
    university = models.ForeignKey(Universities, models.DO_NOTHING)
    academic_period = models.ForeignKey(
        AcademicPeriods,
        models.DO_NOTHING,
        blank=True,
        null=True,
    )
    parameters = models.JSONField()
    data = models.JSONField()
    assigned_count = models.IntegerField()
    unassigned_count = models.IntegerField()
    is_confirmed = models.IntegerField()
    confirmed_at = models.DateTimeField(blank=True, null=True)
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'schedule_versions'
