from django.urls import path
from teachers.views import TeacherListView, TeacherPaginatedView, TeacherDetailView, TeacherToggleStatusView

urlpatterns = [
    path('v1/teachers/', TeacherListView.as_view()),
    path('v1/teachers/paginated/', TeacherPaginatedView.as_view()),
    path('v1/teachers/<int:pk>/', TeacherDetailView.as_view()),
    path('v1/teachers/<int:pk>/toggle-status/', TeacherToggleStatusView.as_view()),
]
