from django.db import models
from universities.models.universities import Universities

class Modalities(models.Model):
    name = models.CharField(max_length=20)
    require_classroom = models.IntegerField()
    status = models.IntegerField()
    configurations = models.JSONField()
    universitiy = models.ForeignKey('Universities', models.DO_NOTHING)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'modalities'