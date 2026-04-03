from rest_framework import serializers

from audit.models import AuditLogs


class AuditLogListSerializer(serializers.ModelSerializer):

    class Meta:
        model = AuditLogs
        fields = [
            'id',
            'created_at',
            'username',
            'table_name',
            'record_id',
            'action',
            'source',
            'is_succesfull',
            'error_message',
        ]
