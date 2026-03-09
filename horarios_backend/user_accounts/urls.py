from django.urls import path
from .views import LoginView, RegisterView, LogoutView, MeView, RefreshView

urlpatterns = [
    path('login/',    LoginView.as_view()),
    path('register/', RegisterView.as_view()),
    path('logout/',   LogoutView.as_view()),
    path('refresh/',  RefreshView.as_view()),
    path('my-info/',  MeView.as_view()),
]