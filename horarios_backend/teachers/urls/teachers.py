from django.urls import path

from teachers.views import (
    TeacherDetailView,
    TeacherListView,
    TeacherPaginatedView,
    TeacherToggleStatusView,
)

urlpatterns = [
    path('v1/university/teachers/', TeacherListView.as_view(), name='teacher-list'),
    path(
        'v1/university/teachers/paginated/',
        TeacherPaginatedView.as_view(),
        name='teacher-paginated',
    ),
    path(
        'v1/university/teachers/<int:pk>/',
        TeacherDetailView.as_view(),
        name='teacher-detail',
    ),
    path(
        'v1/university/teachers/<int:pk>/toggle-status/',
        TeacherToggleStatusView.as_view(),
        name='teacher-toggle-status',
    ),
]
