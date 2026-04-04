from django.urls import path, include

urlpatterns = [
    path('', include('careers.urls.modalities')),
    path('', include('careers.urls.careers')),
    path('', include('careers.urls.groups')),
    path('', include('careers.urls.career_subjects')),
    path('', include('careers.urls.career_period_exceptions')),
]