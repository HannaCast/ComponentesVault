from django.db import models


class Images(models.Model):
    image_name = models.CharField(max_length=45)
    mime_type = models.CharField(max_length=45)
    extension = models.CharField(max_length=10)
    sha256 = models.CharField(max_length=64)
    file_size = models.IntegerField()
    image_path = models.CharField(max_length=100)
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'images'
