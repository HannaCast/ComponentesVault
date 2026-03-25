from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Implementación de Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Rutas de la aplicación
    path('admin/', admin.site.urls),
    path('api/v1/', include('user_accounts.urls')),

    # RUTAS DE ASIGNATURAS
    path('api/v1/subjects/', include('subjects.urls')),
    
    #RUTAS DE UNIVERSIDADES
    path('api/v1/universities/', include('universities.urls')),

    # RUTAS DE PROFESORES
    path('api/v1/teachers/', include('teachers.urls')),

]
