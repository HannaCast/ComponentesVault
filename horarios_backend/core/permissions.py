from functools import wraps
from rest_framework.permissions import BasePermission
from core.api_response import ApiResponse
from core.user_configuration import get_selected_university_id_from_request


class IsAdmin(BasePermission):
    """ Permite el acceso solo a usuarios con rol de administrador """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role is not None
            and request.user.role.name == 'admin'
        )


class RequireSelectedUniversity(BasePermission):
    """Permite acceso solo si el usuario autenticado tiene universidad seleccionada."""

    message = 'Para realizar esta acción debe tener una universidad seleccionada'

    def has_permission(self, request, view):
        selected_university_id = get_selected_university_id_from_request(request)
        if not selected_university_id:
            return False

        # Adjunta el id para reutilizarlo en la vista.
        setattr(request, 'selected_university_id', selected_university_id)
        return True


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


def require_selected_university(
    message='Para realizar esta acción debe tener una universidad seleccionada',
    raise_error=True,
):
    """
    Decorador para exigir universidad seleccionada en métodos específicos.
    """

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            selected_university_id = get_selected_university_id_from_request(request)
            if raise_error and not selected_university_id:
                return ApiResponse.error(message=message, status_code=400)

            setattr(request, 'selected_university_id', selected_university_id)
            return func(self, request, *args, **kwargs)

        return wrapper

    return decorator
