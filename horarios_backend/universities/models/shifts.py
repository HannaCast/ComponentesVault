from django.db import models
class Shifts(models.Model):
    name = models.CharField(max_length=100)
    university = models.ForeignKey('Universities', models.DO_NOTHING)
    order = models.IntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'shifts'
