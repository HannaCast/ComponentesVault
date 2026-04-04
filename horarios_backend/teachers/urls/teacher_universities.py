from django.urls import path

from teachers.views.teacher_universities import (
    TeacherUniversityDetailView,
    TeacherUniversityListView,
)

urlpatterns = [
    path(
        'v1/university/teacher-universities/',
        TeacherUniversityListView.as_view(),
        name='teacher-university-list',
    ),
    path(
        'v1/university/teacher-universities/<int:pk>/',
        TeacherUniversityDetailView.as_view(),
        name='teacher-university-detail',
    ),
]
