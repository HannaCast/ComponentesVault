from django.db import models

class Universities(models.Model):
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=10, blank=True, null=True)
    institution_code = models.CharField(max_length=45, blank=True, null=True)
    image = models.ImageField(upload_to='universities/', blank=True, null=True)
    user = models.ForeignKey('user_accounts.User', on_delete=models.DO_NOTHING)
    start_time = models.TimeField()
    uses_period_groups = models.IntegerField(default=0)
    end_time = models.TimeField()
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'universities'
