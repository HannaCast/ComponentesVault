from django.urls import path

from schedule_generator.views import ScheduleGeneratorView

urlpatterns = [
    path(
        'v1/university/schedules/generate/',
        ScheduleGeneratorView.as_view(),
        name='schedule-generator-generate',
    ),
    path(
        'schedule-generator/preview/',
        ScheduleGeneratorView.as_view(),
        name='schedule-generator-preview',
    ),
]
