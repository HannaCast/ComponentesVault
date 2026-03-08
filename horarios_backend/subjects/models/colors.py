from django.db import models


# Modelo de colores para las materias
class Colors(models.Model):
    name = models.CharField(max_length=45)
    hex = models.CharField(max_length=6)
    contrast_hex = models.CharField(max_length=6)
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'colors'
