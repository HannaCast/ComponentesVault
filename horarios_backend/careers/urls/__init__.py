from django.urls import path, include

urlpatterns = [
    path('', include('careers.urls.modalities')),
    path('', include('careers.urls.careers')),
]