from django.urls import path

from universities.views import PeriodTypesListView

urlpatterns = [
    path('v1/period-types/', PeriodTypesListView.as_view()),
]

