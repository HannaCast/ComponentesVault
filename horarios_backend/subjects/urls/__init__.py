from django.urls import path, include

urlpatterns = [
    path('', include('subjects.urls.colors')),
]
