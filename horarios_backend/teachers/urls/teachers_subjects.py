from django.urls import path

from teachers.views import (
    TeacherSubjectDetailView,
    TeacherSubjectListView,
)

urlpatterns = [
    path('v1/university/teachers-subjects/', TeacherSubjectListView.as_view()),
    path('v1/university/teachers-subjects/<int:pk>/', TeacherSubjectDetailView.as_view()),
]
