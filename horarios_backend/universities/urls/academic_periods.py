from django.urls import path

from universities.views import (
    AcademicPeriodDetailView,
    AcademicPeriodListCreateView,
    AcademicPeriodToggleStatusView,
)

urlpatterns = [
    path('v1/academic-periods/', AcademicPeriodListCreateView.as_view()),
    path('v1/academic-periods/<int:pk>/', AcademicPeriodDetailView.as_view()),
    path(
        'v1/academic-periods/<int:pk>/toggle-status/',
        AcademicPeriodToggleStatusView.as_view(),
    ),
]

