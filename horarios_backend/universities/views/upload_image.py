import logging
import os

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.api_response import ApiResponse
from core.audit_context import with_audit_context
from universities.models import Universities
from universities.models.images import Images
from universities.serializers.images.image_serializer import UploadImageSerializer
from universities.services.university_image_upload import (
    display_image_name,
    media_path_for_images,
    safe_storage_basename,
    sha256_file_chunks,
)

logger = logging.getLogger(__name__)


@extend_schema(
    tags=['Universities'],
    request=UploadImageSerializer,
    responses={200: None},
    description='Subir imagen de universidad',
    summary='Subir logo de universidad',
)
class UniversityUploadImageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    @with_audit_context(table_name='universities')
    def post(self, request, pk):
        # Con MultiPartParser, `request.data` ya incluye los ficheros; no pasar `files=`
        # (en DRF reciente provoca TypeError al propagarse el kwarg a los campos).
        serializer = UploadImageSerializer(data=request.data)
        if not serializer.is_valid():
            return ApiResponse.error(errors=serializer.errors)

        uploaded = serializer.validated_data['image']
        university = get_object_or_404(
            Universities,
            pk=pk,
            user=request.user,
            status=1,
            is_deleted=0,
        )

        storage_name, extension = safe_storage_basename(
            uploaded.content_type,
            uploaded.name,
        )
        abs_path, relative_path = media_path_for_images(storage_name)
        sha256 = sha256_file_chunks(uploaded)
        mime_type = (uploaded.content_type or '')[:45]
        file_size = uploaded.size
        image_name = display_image_name(uploaded.name)

        file_written = False
        try:
            with open(abs_path, 'wb+') as destination:
                for chunk in uploaded.chunks():
                    destination.write(chunk)
            file_written = True

            with transaction.atomic():
                image = Images.objects.create(
                    image_name=image_name,
                    mime_type=mime_type,
                    extension=extension,
                    sha256=sha256,
                    file_size=file_size,
                    image_path=relative_path[:100],
                    is_deleted=0,
                    created_at=timezone.now(),
                    created_by=request.user.get_username(),
                )
                university.image = image
                university.save(
                    update_fields=['image'],
                )

        except Exception:
            logger.exception('Error al subir imagen de universidad pk=%s', pk)
            if file_written and os.path.isfile(abs_path):
                try:
                    os.remove(abs_path)
                except OSError:
                    pass
            return ApiResponse.error(
                message='No se pudo guardar la imagen',
                status_code=500,
            )

        return ApiResponse.success(
            data={
                'image_id': image.id,
                'image_path': relative_path,
            },
            message='Imagen subida correctamente',
        )
