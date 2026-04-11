from django.urls import path

from classrooms.views import (
    ClassroomDetailView,
    ClassroomListView,
    ClassroomPaginatedView,
    ClassroomToggleStatusView,
)

urlpatterns = [
    path('v1/university/classrooms/', ClassroomListView.as_view()),
    path('v1/university/classrooms/paginated/', ClassroomPaginatedView.as_view()),
    path('v1/university/classrooms/<int:pk>/', ClassroomDetailView.as_view()),
    path('v1/university/classrooms/<int:pk>/toggle-status/', ClassroomToggleStatusView.as_view()),
]

