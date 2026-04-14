from django.urls import path
from subjects.views import ColorListView, ColorPaginatedView, ColorDetailView, ColorToggleStatusView

urlpatterns = [
    path('v1/subjects/colors/', ColorListView.as_view()),
    path('v1/subjects/colors/paginated/', ColorPaginatedView.as_view()),
    path('v1/subjects/colors/<int:pk>/', ColorDetailView.as_view()),
    path('v1/subjects/colors/<int:pk>/toggle-status/', ColorToggleStatusView.as_view()),
]
