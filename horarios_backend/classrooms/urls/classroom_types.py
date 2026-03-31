from django.urls import path

from classrooms.views.classroom_types import ClassroomTypesListView

urlpatterns = [
    path('v1/classroom-types/', ClassroomTypesListView.as_view()),
]

