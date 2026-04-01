from django.urls import include, path

urlpatterns = [
    # Endpoints existentes de universidades
    path('', include('universities.urls.universities')),

    # Nuevos módulos
    path('', include('universities.urls.period_types')),
]