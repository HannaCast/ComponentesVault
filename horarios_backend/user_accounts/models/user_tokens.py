from django.db import models

from user_accounts.models.user import User


class UserToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    token = models.CharField(unique=True, max_length=64)
    type = models.CharField(max_length=18)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'user_tokens'
