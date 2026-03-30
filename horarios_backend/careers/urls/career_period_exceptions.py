from django.urls import path

from careers.views import (
    CareerPeriodExceptionDetailView,
    CareerPeriodExceptionListView,
)

urlpatterns = [
    path(
        'v1/university/career-period-exceptions/',
        CareerPeriodExceptionListView.as_view(),
    ),
    path(
        'v1/university/career-period-exceptions/<int:pk>/',
        CareerPeriodExceptionDetailView.as_view(),
    ),
]
