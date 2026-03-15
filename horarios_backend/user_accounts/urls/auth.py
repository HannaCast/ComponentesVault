from django.urls import path
from user_accounts.views.auth import LoginView, RegisterView, LogoutView, RefreshView

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('register/', RegisterView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('refresh/', RefreshView.as_view()),
]
