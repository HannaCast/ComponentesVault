from django.db import models
from .colors import Colors


class Subjects(models.Model):
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=10, blank=True, null=True)
    code = models.CharField(max_length=50, blank=True, null=True)
    description = models.CharField(max_length=45, blank=True, null=True)
    hours_per_week = models.IntegerField()
    color = models.ForeignKey(Colors, models.DO_NOTHING)
    is_mandatory = models.IntegerField( default=0 )
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'subjects'