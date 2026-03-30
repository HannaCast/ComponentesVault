from django.urls import path
from teachers.views import TeacherListView, TeacherPaginatedView, TeacherDetailView, TeacherToggleStatusView

urlpatterns = [
    path('teachers/', TeacherListView.as_view()),
    path('teachers/paginated/', TeacherPaginatedView.as_view()),
    path('teachers/<int:pk>/', TeacherDetailView.as_view()),
    path('teachers/<int:pk>/toggle-status/', TeacherToggleStatusView.as_view()),
]
