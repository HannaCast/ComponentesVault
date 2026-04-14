from django.urls import path

from careers.views.groups import (
    GroupDetailView,
    GroupListView,
    GroupPaginatedView,
    GroupToggleStatusView,
)

urlpatterns = [
    path('v1/university/groups/', GroupListView.as_view(), name='group-list'),
    path(
        'v1/university/groups/paginated/',
        GroupPaginatedView.as_view(),
        name='group-paginated',
    ),
    path(
        'v1/university/groups/<int:pk>/toggle-status/',
        GroupToggleStatusView.as_view(),
        name='group-toggle-status',
    ),
    path(
        'v1/university/groups/<int:pk>/',
        GroupDetailView.as_view(),
        name='group-detail',
    ),
]
