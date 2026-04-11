from django.urls import path

from universities.views.shifts import ShiftDetailView, ShiftListView

urlpatterns = [
    path('v1/university/shifts/', ShiftListView.as_view(), name='shift-list'),
    path(
        'v1/university/shifts/<int:pk>/',
        ShiftDetailView.as_view(),
        name='shift-detail',
    ),
]
