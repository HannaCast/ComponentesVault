from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from .models import Colors
from .serializers import ColorSerializer


@extend_schema(tags=['Colors'])
class ColorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Lista todos los colores activos """
        colors = Colors.objects.filter(status=1)
        serializer = ColorSerializer(colors, many=True)
        return Response(serializer.data)

    def post(self, request):
        """ Crea un nuevo color """
        serializer = ColorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ColorSerializer(color)
        return Response(serializer.data)

    def put(self, request, pk):
        """ Actualiza un color """
        color = self.get_object(pk)
        if color is None:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ColorSerializer(color, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """ Actualiza parcialmente un color """
        color = self.get_object(pk)
        if color is None:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ColorSerializer(color, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """ Desactiva un color (soft delete) """
        color = self.get_object(pk)
        if color is None:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        color.status = 0
        color.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
