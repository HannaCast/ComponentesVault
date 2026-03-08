from django.urls import path
from subjects.views import ColorListView, ColorDetailView, ColorToggleStatusView

urlpatterns = [
    path('colors/', ColorListView.as_view()),
    path('colors/<int:pk>/', ColorDetailView.as_view()),
    path('colors/<int:pk>/toggle-status/', ColorToggleStatusView.as_view()),
]
