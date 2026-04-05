import os
import hashlib
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from universities.models import Universities
from universities.models.images import Images
from core.api_response import ApiResponse

from universities.serializers.images.image_serializer import UploadImageSerializer


@extend_schema(
    request=UploadImageSerializer,
    responses={200: None},
    description="Subir imagen de universidad",
)
class UniversityUploadImageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, pk):
        university = get_object_or_404(Universities, pk=pk)

        file = request.FILES.get('image')

        if not file:
            return ApiResponse.error(message="No se envió imagen")

        # =========================
        # DATOS DEL ARCHIVO
        # =========================
        file_name = file.name
        extension = file_name.split('.')[-1]
        mime_type = file.content_type
        file_size = file.size

        # =========================
        # HASH SHA256
        # =========================
        sha256 = hashlib.sha256(file.read()).hexdigest()
        file.seek(0)

        # =========================
        # GUARDAR ARCHIVO
        # =========================
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'images')
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, file_name)

        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        relative_path = f"images/{file_name}"

        # =========================
        # CREAR IMAGE
        # =========================
        image = Images.objects.create(
            image_name=file_name,
            mime_type=mime_type,
            extension=extension,
            sha256=sha256,
            file_size=file_size,
            image_path=relative_path,
            is_deleted=0,
            created_at=timezone.now(),
            created_by=request.user.get_username()
        )

        # =========================
        # ASIGNAR A UNIVERSIDAD
        # =========================
        university.image = image
        university.save()

        return ApiResponse.success(
            data={
                "image_id": image.id,
                "image_path": relative_path
            },
            message="Imagen subida correctamente"
        )