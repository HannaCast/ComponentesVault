from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, LogoutView, MeView

urlpatterns = [
    path('login/',    LoginView.as_view()),
    path('register/', RegisterView.as_view()),
    path('logout/',   LogoutView.as_view()),
    path('refresh/',  TokenRefreshView.as_view()),
    path('my-info/',       MeView.as_view()),  # Datos del usuario actual
]