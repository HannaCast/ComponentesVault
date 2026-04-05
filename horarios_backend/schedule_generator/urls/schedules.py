from django.urls import path

from schedule_generator.views import (
    ScheduleGeneratorPreviewView,
    ScheduleVersionConfirmView,
    ScheduleVersionDetailView,
    ScheduleVersionDraftDetailView,
    ScheduleVersionGenerateView,
    ScheduleVersionLabelView,
    ScheduleVersionPaginatedView,
)


urlpatterns = [
    path(
        'v1/university/schedules/generate/',
        ScheduleVersionGenerateView.as_view(),
        name='schedule-generator-generate',
    ),
    path(
        'v1/university/schedules/paginated/',
        ScheduleVersionPaginatedView.as_view(),
        name='schedule-versions-paginated',
    ),
    path(
        'v1/university/schedules/<int:pk>/',
        ScheduleVersionDetailView.as_view(),
        name='schedule-versions-detail',
    ),
    path(
        'v1/university/schedules/<int:pk>/confirm/',
        ScheduleVersionConfirmView.as_view(),
        name='schedule-versions-confirm',
    ),
    path(
        'v1/university/schedules/<int:pk>/label/',
        ScheduleVersionLabelView.as_view(),
        name='schedule-versions-label',
    ),
    path(
        'v1/university/schedules/drafts/<int:pk>/',
        ScheduleVersionDraftDetailView.as_view(),
        name='schedule-versions-draft-detail',
    ),

    # Ruta legada para pruebas de algoritmo sin persistencia.
    path(
        'schedule-generator/preview/',
        ScheduleGeneratorPreviewView.as_view(),
        name='schedule-generator-preview',
    ),
]
