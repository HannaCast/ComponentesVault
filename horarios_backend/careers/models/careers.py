from django.db import models
from universities.models.universities import Universities
from careers.models.modalities import Modalities

class Careers(models.Model):
    name = models.CharField(max_length=100)
    university = models.ForeignKey(Universities, models.DO_NOTHING)
    short_name = models.CharField(max_length=20, blank=True, null=True)
    code = models.CharField(max_length=50, blank=True, null=True)
    parent_career = models.ForeignKey('self', models.DO_NOTHING, db_column='parent_career_id', blank=True, null=True)
    continuation_from_period = models.IntegerField(default=1, blank=True, null=True)
    modality = models.ForeignKey(Modalities, models.DO_NOTHING)
    total_periods = models.IntegerField()
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'careers'