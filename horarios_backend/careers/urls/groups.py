from django.urls import path
from careers.views.groups import GroupCreate, GroupList, GroupDetail

urlpatterns = [
    path('v1/groups/', GroupList.as_view(), name='group-list'),
    path('v1/groups/create/', GroupCreate.as_view(), name='group-create'),
    path('v1/groups/<int:group_id>/', GroupDetail.as_view(), name='group-detail'),
]