from django.urls import include, path

urlpatterns = [
    path('', include('universities.urls.universities')),
    path('', include('universities.urls.period_types')),
    path('', include('universities.urls.shifts')),
    path('', include('universities.urls.academic_periods')),
    path('', include('universities.urls.classroom_type_priorities')),
]