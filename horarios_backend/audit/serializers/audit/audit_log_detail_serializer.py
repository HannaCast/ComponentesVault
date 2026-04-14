from rest_framework import serializers

from audit.models import AuditLogs


class AuditLogDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = AuditLogs
        fields = [
            'id',
            'user_id',
            'username',
            'source',
            'transaction_id',
            'table_name',
            'record_id',
            'action',
            'old_data',
            'new_data',
            'ip_address',
            'user_agent',
            'is_succesfull',
            'error_message',
            'created_at',
        ]
