from django.db import models


# Modelo de colores para las materias
class Colors(models.Model):
    name = models.CharField(max_length=45)
    hex = models.CharField(max_length=6)
    contrast_hex = models.CharField(max_length=6)
    status = models.IntegerField()
    create_at = models.DateTimeField(blank=True, null=True)
    create_by = models.DateTimeField(blank=True, null=True)
    update_at = models.DateTimeField(blank=True, null=True)
    update_by = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'colors'
