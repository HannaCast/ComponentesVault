from django.db import models

from universities.models.images import Images
from universities.models.period_types import PeriodTypes

class Universities(models.Model):
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=10, blank=True, null=True)
    institution_code = models.CharField(max_length=45, blank=True, null=True)
    image = models.ForeignKey(Images, models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey('user_accounts.User', models.DO_NOTHING)
    start_time = models.TimeField()
    end_time = models.TimeField()
    period_type = models.ForeignKey(PeriodTypes, models.DO_NOTHING)
    uses_period_groups = models.IntegerField()
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'universities'
