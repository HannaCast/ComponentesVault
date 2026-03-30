from django.urls import path

from careers.views import (
    CareerSubjectDetailView,
    CareerSubjectListView,
)

urlpatterns = [
    path('v1/university/career-subjects/', CareerSubjectListView.as_view()),
    path('v1/university/career-subjects/<int:pk>/', CareerSubjectDetailView.as_view(),),
]
