from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from core.api_response import ApiResponse
from core.permissions import IsAdmin, require_permissions
from subjects.models import Colors
from subjects.serializers import ColorSerializer, ColorReadSerializer


@extend_schema(tags=['Colors'])
class ColorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Lista todos los colores activos """
        colors = Colors.objects.filter(status=1)
        return ApiResponse.success(ColorReadSerializer(colors, many=True).data)

    def post(self, request):
        """ Crea un nuevo color """
        serializer = ColorSerializer(data=request.data)
        if serializer.is_valid():
            color = serializer.save()
            return ApiResponse.created(ColorReadSerializer(color).data)
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Colors'])
class ColorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """ Busca un color por su ID, retorna None si no existe """
        try:
            return Colors.objects.get(pk=pk)
        except Colors.DoesNotExist:
            return None

    def get(self, request, pk):
        """ Obtiene un color por ID """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ColorReadSerializer(color).data)

    @require_permissions(IsAdmin)
    def put(self, request, pk):
        """ Actualiza uno o varios campos de un color (todos los campos son opcionales) """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        serializer = ColorSerializer(color, data=request.data, partial=True)
        if serializer.is_valid():
            color = serializer.save()
            return ApiResponse.success(ColorReadSerializer(color).data, message='Color actualizado exitosamente')
        return ApiResponse.error(errors=serializer.errors)

    @require_permissions(IsAdmin)
    def delete(self, request, pk):
        """ Desactiva un color (soft delete) """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        color.status = 0
        color.save()
        return ApiResponse.deleted('Color desactivado exitosamente')


@extend_schema(tags=['Colors'])
class ColorToggleStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @require_permissions(IsAdmin)
    def patch(self, request, pk):
        """ Alterna el status de un color entre activo (1) e inactivo (0) """
        try:
            color = Colors.objects.get(pk=pk)
        except Colors.DoesNotExist:
            return ApiResponse.not_found()

        color.status = 0 if color.status == 1 else 1
        color.save()

        estado = 'activado' if color.status == 1 else 'desactivado'
        return ApiResponse.success(
            data=ColorReadSerializer(color).data,
            message=f'Color {estado} exitosamente',
        )
