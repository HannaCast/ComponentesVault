from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema
from rest_framework import serializers

from universities.models import Universities
from core.api_response import ApiResponse


# Serializer para Swagger (file upload)
class UploadImageSerializer(serializers.Serializer):
    image = serializers.FileField()


@extend_schema(
    request=UploadImageSerializer,
    responses={200: None},
    description="Subir imagen de universidad",
    summary="Upload image university"
)
class UniversityUploadImageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, pk):
        university = get_object_or_404(Universities, pk=pk)

        image = request.FILES.get('image')

        if not image:
            return ApiResponse.error(
                message="No se envió ninguna imagen"
            )

        university.image = image
        university.save()

        return ApiResponse.success(
            message="Imagen subida correctamente"
        )