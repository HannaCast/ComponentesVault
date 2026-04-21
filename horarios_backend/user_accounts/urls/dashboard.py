from django.urls import path

from user_accounts.views.dashboard import UniversityDashboardSummaryView

urlpatterns = [
    path('university/dashboard/summary/', UniversityDashboardSummaryView.as_view()),
]
