from django.urls import path
from user_accounts.views.user import (
    ConfigurationView,
    MeView,
    SelectedUniversityConfigurationView,
)

urlpatterns = [
    path('my-info/', MeView.as_view()),
    path('configurations/', ConfigurationView.as_view()),
    path('configurations/selected-university/', SelectedUniversityConfigurationView.as_view()),
]
