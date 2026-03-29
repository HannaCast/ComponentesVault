from django.urls import path, include

urlpatterns = [
    path('', include('careers.urls.modalities')),
]