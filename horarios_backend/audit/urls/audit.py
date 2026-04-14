from django.urls import path

from audit.views import AuditLogDetailView, AuditLogPaginatedView

urlpatterns = [
    path('v1/audit/logs/paginated/', AuditLogPaginatedView.as_view()),
    path('v1/audit/logs/<int:pk>/', AuditLogDetailView.as_view()),
]
