from rest_framework.response import Response
import math


class ApiResponse:
    """
    Clase utilitaria para respuestas estandarizadas de la API.
    Reutilizable en todos los views del proyecto.
    """

    @staticmethod
    def success(data=None, message='Operación exitosa', status_code=200):
        return Response({
            'error': False,
            'statusCode': status_code,
            'message': message,
            'data': data,
        }, status=status_code)

    @staticmethod
    def created(data=None, message='Recurso creado exitosamente'):
        return Response({
            'error': False,
            'statusCode': 201,
            'message': message,
            'data': data,
        }, status=201)

    @staticmethod
    def deleted(message='Recurso eliminado exitosamente'):
        return Response({
            'error': False,
            'statusCode': 200,
            'message': message,
            'data': None,
        }, status=200)

    @staticmethod
    def paginated(data, page, limit, total, message='Operación exitosa'):
        return Response({
            'error': False,
            'statusCode': 200,
            'message': message,
            'data': data,
            'meta': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': math.ceil(total / limit) if limit else 1,
            },
        }, status=200)

    @staticmethod
    def error(message='Ha ocurrido un error', status_code=400, errors=None):
        return Response({
            'error': True,
            'statusCode': status_code,
            'message': message,
            'data': errors,
        }, status=status_code)

    @staticmethod
    def not_found(message='Recurso no encontrado'):
        return Response({
            'error': True,
            'statusCode': 404,
            'message': message,
            'data': None,
        }, status=404)
