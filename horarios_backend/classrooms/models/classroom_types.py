from django.db import models


class ClassroomTypes(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True, null=True)
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'classroom_types'

