from django.urls import path
from subjects.views import SubjectListView, SubjectPaginatedView, SubjectDetailView, SubjectToggleStatusView

urlpatterns = [
    path('v1/university/subjects/', SubjectListView.as_view()),
    path('v1/university/subjects/paginated/', SubjectPaginatedView.as_view()),
    path('v1/university/subjects/<int:pk>/', SubjectDetailView.as_view()),
    path('v1/university/subjects/<int:pk>/toggle-status/', SubjectToggleStatusView.as_view()),
]