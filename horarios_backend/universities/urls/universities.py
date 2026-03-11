from django.urls import path
from universities.views import UniversityCreate, UniversityList, UniversityDetail

urlpatterns = [
    path('universities/', UniversityList.as_view()),
    path('universities/create/', UniversityCreate.as_view()),
    path('universities/<int:university_id>/', UniversityDetail.as_view()),
]