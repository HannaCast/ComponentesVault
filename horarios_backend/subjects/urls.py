from django.urls import path
from .views import ColorListView, ColorDetailView

urlpatterns = [
    # Colors
    path('colors/', ColorListView.as_view()),
    path('colors/<int:pk>/', ColorDetailView.as_view()),

    # Subjects (se agregarán las vistas cuando se implemente el modelo)
    # path('subjects/', SubjectListView.as_view()),
    # path('subjects/<int:pk>/', SubjectDetailView.as_view()),
]
