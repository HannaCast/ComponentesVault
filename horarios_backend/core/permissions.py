from functools import wraps
from rest_framework.permissions import BasePermission
from core.api_response import ApiResponse


class IsAdmin(BasePermission):
    """ Permite el acceso solo a usuarios con rol de administrador """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role is not None
            and request.user.role.name == 'admin'
        )


def require_permissions(*permission_classes):
    """
    Decorador para aplicar permisos directamente sobre un método de una vista.
    Uso: @require_permissions(IsAdmin)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            for permission_class in permission_classes:
                permission = permission_class()
                if not permission.has_permission(request, self):
                    return ApiResponse.error(
                        message='No tienes permisos para realizar esta acción',
                        status_code=403,
                    )
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator
