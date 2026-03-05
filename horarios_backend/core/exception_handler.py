from rest_framework.views import exception_handler as drf_exception_handler
from core.api_response import ApiResponse


def custom_exception_handler(exc, context):
    """
    Exception handler global para estandarizar todas las respuestas de error
    a través de ApiResponse, incluyendo errores de autenticación de SimpleJWT.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        data = response.data

        if isinstance(data, dict) and 'detail' in data:
            message = str(data['detail'])
            errors = None
        elif isinstance(data, dict):
            message = 'Error de validación'
            errors = data
        else:
            message = str(data)
            errors = None

        if response.status_code == 404:
            return ApiResponse.not_found(message=message)

        return ApiResponse.error(
            message=message,
            status_code=response.status_code,
            errors=errors,
        )

    return response
