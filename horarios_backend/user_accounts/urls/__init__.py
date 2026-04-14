from django.urls import path, include

urlpatterns = [
    path('auth/', include('user_accounts.urls.auth')),
    path('user/', include('user_accounts.urls.user')),
]
