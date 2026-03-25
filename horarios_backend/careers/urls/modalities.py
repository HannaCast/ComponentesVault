from django.urls import path
from careers.views import (
    ModalitiesListView,
    ModalitiesPaginatedView,
    ModalitiesDetailView,
    ModalitiesToggleStatusView,
)

urlpatterns = [
    path('v1/university/modalities/', ModalitiesListView.as_view()),
    path('v1/university/modalities/paginated/', ModalitiesPaginatedView.as_view()),
    path('v1/university/modalities/<int:pk>/', ModalitiesDetailView.as_view()),
    path('v1/university/modalities/<int:pk>/toggle-status/', ModalitiesToggleStatusView.as_view()),
]