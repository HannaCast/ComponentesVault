from django.db import models

class AuditLogs(models.Model):
    id = models.BigAutoField(primary_key=True)
    user_id = models.IntegerField(blank=True, null=True)
    username = models.CharField(max_length=100, blank=True, null=True)
    source = models.CharField(max_length=20, blank=True, null=True)
    transaction_id = models.CharField(max_length=36, blank=True, null=True)
    table_name = models.CharField(max_length=100)
    record_id = models.IntegerField(blank=True, null=True)
    action = models.CharField(max_length=20)
    old_data = models.JSONField()
    new_data = models.JSONField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    is_succesfull = models.IntegerField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'audit_logs'