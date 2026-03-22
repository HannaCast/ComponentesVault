from django.urls import path
from subjects.views import SubjectListView, SubjectPaginatedView, SubjectDetailView, SubjectToggleStatusView

urlpatterns = [
    path('subjects/', SubjectListView.as_view()),
    path('subjects/paginated/', SubjectPaginatedView.as_view()),
    path('subjects/<int:pk>/', SubjectDetailView.as_view()),
    path('subjects/<int:pk>/toggle-status/', SubjectToggleStatusView.as_view()),
]