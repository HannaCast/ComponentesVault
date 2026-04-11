from django.urls import path

from classrooms.views import (
    ClassroomCareerDetailView,
    ClassroomCareerListView,
)

urlpatterns = [
    path('v1/university/classroom-careers/', ClassroomCareerListView.as_view()),
    path('v1/university/classroom-careers/<int:pk>/', ClassroomCareerDetailView.as_view()),
]
