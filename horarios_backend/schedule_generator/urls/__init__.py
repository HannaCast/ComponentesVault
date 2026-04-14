from django.urls import include, path

urlpatterns = [
    path('', include('schedule_generator.urls.schedules')),
]
