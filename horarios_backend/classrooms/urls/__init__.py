from django.urls import include, path

urlpatterns = [
    path('', include('classrooms.urls.classroom_types')),
]

