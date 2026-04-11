from django.urls import include, path

urlpatterns = [
    path('', include('classrooms.urls.classroom_types')),
    path('', include('classrooms.urls.classrooms')),
    path('', include('classrooms.urls.classroom_careers')),
]

