from django.urls import path

from universities.views import UniversityCreate, UniversityList, UniversityDetail

urlpatterns = [
    path('v1/universities/', UniversityList.as_view()),
    path('v1/universities/create/', UniversityCreate.as_view()),
    path('v1/universities/<int:university_id>/', UniversityDetail.as_view()),
]