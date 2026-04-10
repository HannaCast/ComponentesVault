from django.db import models

from user_accounts.models.user import User
from universities.models.universities import Universities


class UserConfiguration(models.Model):
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    selected_university = models.ForeignKey(
        Universities,
        on_delete=models.DO_NOTHING,
        blank=True,
        null=True,
    )
    theme = models.CharField(
        max_length=10,
        db_comment='El tema de la aplicación, ya sea oscuro (dark) o blanco (light)',
    )
    accent = models.CharField(
        max_length=10,
        db_comment='el color de la interfaz, ejemplo, rojo, verde, azul',
    )
    schedule_generation = models.JSONField()
    status = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'user_configurations'
