from django.db import models


class Teachers(models.Model):
    name = models.CharField(max_length=45)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    required_classroom = models.IntegerField()
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'teachers'
