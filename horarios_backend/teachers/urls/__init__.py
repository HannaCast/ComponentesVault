from django.urls import path, include

urlpatterns = [
    path('', include('teachers.urls.teachers')),
    path('', include('teachers.urls.teacher_availabilities')),
]
