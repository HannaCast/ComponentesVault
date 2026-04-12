import os

from django.conf import settings
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Implementación de Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Rutas de la aplicación
    path('api/v1/', include('user_accounts.urls')),

    # RUTAS DE ASIGNATURAS
    path('api/', include('subjects.urls')),
    
    #RUTAS DE UNIVERSIDADES
    path('api/', include('universities.urls')),

    # RUTAS DE CARRERAS / MODALIDADES
    path('api/', include('careers.urls')),

    # RUTAS DE PROFESORES
    path('api/', include('teachers.urls')),

    # RUTAS DE AULAS
    path('api/', include('classrooms.urls')),

    # RUTAS DE AUDITORIA
    path('api/', include('audit.urls')),

    # RUTAS DE GENERADOR DE HORARIOS
    path('api/', include('schedule_generator.urls')),

]


def _should_serve_uploaded_media() -> bool:
    """
    Sirve /media/ en desarrollo.

    - Con DEBUG=True, Django añade la ruta (comportamiento habitual).
    - Si DEBUG está en False pero necesitas ver logos en local, define en .env:
      DJANGO_SERVE_MEDIA=True
    """
    if settings.DEBUG:
        return True
    return os.getenv('DJANGO_SERVE_MEDIA', '').strip().lower() in (
        '1',
        'true',
        'yes',
        'on',
    )


if _should_serve_uploaded_media():
    # document_root como str evita problemas con Path en algunos entornos Windows
    _media_root = str(settings.MEDIA_ROOT)
    urlpatterns += [
        re_path(
            r'^media/(?P<path>.*)$',
            serve,
            {'document_root': _media_root},
        ),
    ]
