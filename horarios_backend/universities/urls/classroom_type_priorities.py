from django.urls import path

from universities.views import (
    UniversityClassroomTypePriorityDetailView,
    UniversityClassroomTypePriorityListCreateView,
)

urlpatterns = [
    path(
        'v1/university/classroom-type-priorities/',
        UniversityClassroomTypePriorityListCreateView.as_view(),
        name='university-classroom-type-priority-list-create',
    ),
    path(
        'v1/university/classroom-type-priorities/<int:pk>/',
        UniversityClassroomTypePriorityDetailView.as_view(),
        name='university-classroom-type-priority-detail',
    ),
]
