from django.urls import path

from universities.views import PeriodTypesSelectView

urlpatterns = [
    path('v1/period-types/', PeriodTypesSelectView.as_view()),
]

