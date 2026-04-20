from django.urls import path

from universities.views import (
    UniversityCreate,
    UniversityDetail,
    UniversityFullSetupUpdateView,
    UniversityFullSetupView,
    UniversityList,
    UniversityProfileView,
)
from universities.views.university_images import UniversityImageByUniversityView, UniversityUploadImageView

urlpatterns = [
    path('v1/universities/', UniversityList.as_view()),
    path('v1/universities/create/', UniversityCreate.as_view()),
    path('v1/universities/<int:university_id>/profile/', UniversityProfileView.as_view()),
    path('v1/universities/<int:university_id>/image/', UniversityImageByUniversityView.as_view()),
    path('v1/universities/<int:university_id>/full-setup/', UniversityFullSetupUpdateView.as_view()),
    path('v1/universities/<int:university_id>/', UniversityDetail.as_view()),
    path('setup/university-complete/', UniversityFullSetupView.as_view()),
    path('universities/<int:pk>/upload-image/', UniversityUploadImageView.as_view()),
]



