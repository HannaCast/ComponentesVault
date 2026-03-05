from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from core.api_response import ApiResponse
from .models import Colors
from .serializers import ColorSerializer


@extend_schema(tags=['Colors'])
class ColorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Lista todos los colores activos """
        colors = Colors.objects.filter(status=1)
        serializer = ColorSerializer(colors, many=True)
        return ApiResponse.success(serializer.data)

    def post(self, request):
        """ Crea un nuevo color """
        serializer = ColorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return ApiResponse.created(serializer.data)
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Colors'])
class ColorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Colors.objects.get(pk=pk)
        except Colors.DoesNotExist:
            return None

    def get(self, request, pk):
        """ Obtiene un color por ID """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ColorSerializer(color).data)

    def put(self, request, pk):
        """ Actualiza un color """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        serializer = ColorSerializer(color, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return ApiResponse.success(serializer.data, message='Color actualizado exitosamente')
        return ApiResponse.error(errors=serializer.errors)

    def patch(self, request, pk):
        """ Actualiza parcialmente un color """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        serializer = ColorSerializer(color, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return ApiResponse.success(serializer.data, message='Color actualizado exitosamente')
        return ApiResponse.error(errors=serializer.errors)

    def delete(self, request, pk):
        """ Desactiva un color (soft delete) """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        color.status = 0
        color.save()
        return ApiResponse.deleted('Color desactivado exitosamente')
