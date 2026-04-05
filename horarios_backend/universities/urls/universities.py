from django.urls import path

from universities.views import UniversityCreate, UniversityList, UniversityDetail
from universities.views import UniversityFullSetupView
from universities.views.upload_image import UniversityUploadImageView

urlpatterns = [
    path('v1/universities/', UniversityList.as_view()),
    path('v1/universities/create/', UniversityCreate.as_view()),
    path('v1/universities/<int:university_id>/', UniversityDetail.as_view()),
    path('setup/university-complete/', UniversityFullSetupView.as_view()),
    path('universities/<int:pk>/upload-image/', UniversityUploadImageView.as_view()),
]



