from django.urls import path
from careers.views import (
    CareerDetailView,
    CareerListView,
    CareerPaginatedView,
    CareerToggleStatusView,
)

urlpatterns = [
    path('v1/university/careers/', CareerListView.as_view()),
    path('v1/university/careers/paginated/', CareerPaginatedView.as_view()),
    path('v1/university/careers/<int:pk>/', CareerDetailView.as_view()),
    path('v1/university/careers/<int:pk>/toggle-status/', CareerToggleStatusView.as_view()),
]