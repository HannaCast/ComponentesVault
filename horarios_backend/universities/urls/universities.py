from django.urls import path

from universities.views import UniversityCreate, UniversityList, UniversityDetail
from universities.views import UniversityFullSetupView

urlpatterns = [
    path('v1/universities/', UniversityList.as_view()),
    path('v1/universities/create/', UniversityCreate.as_view()),
    path('v1/universities/<int:university_id>/', UniversityDetail.as_view()),
    path('setup/university-complete/', UniversityFullSetupView.as_view()),
]