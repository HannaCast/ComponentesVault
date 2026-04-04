from django.urls import path
from universities.views import UniversityCreate, UniversityList, UniversityDetail
from universities.views.shifts import ShiftList, ShiftCreate, ShiftDetail 

urlpatterns = [
    path('v1/universities/', UniversityList.as_view()),
    path('v1/universities/create/', UniversityCreate.as_view()),
    path('v1/universities/<int:university_id>/', UniversityDetail.as_view()),
    

    path('v1/shifts/', ShiftList.as_view(), name='shift-list'),
    path('v1/shifts/create/', ShiftCreate.as_view(), name='shift-create'),
    path('v1/shifts/<int:shift_id>/', ShiftDetail.as_view(), name='shift-detail'),
]