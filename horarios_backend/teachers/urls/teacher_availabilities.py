from django.urls import path
from teachers.views import (
    TeacherAvailabilityListView,
    TeacherAvailabilityPaginatedView,
    TeacherAvailabilityDetailView,
    TeacherAvailabilityToggleView,
)

urlpatterns = [
    path('v1/teacher-availabilities/', TeacherAvailabilityListView.as_view()),
    path('v1/teacher-availabilities/paginated/', TeacherAvailabilityPaginatedView.as_view()),
    path('v1/teacher-availabilities/<int:pk>/', TeacherAvailabilityDetailView.as_view()),
    path('v1/teacher-availabilities/<int:pk>/toggle-available/', TeacherAvailabilityToggleView.as_view()),
]
