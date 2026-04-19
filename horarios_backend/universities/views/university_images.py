import logging
import os
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
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


def _resolve_media_file(image_path: str):
    rel = (image_path or '').strip().replace('\\', '/').lstrip('/')
    if not rel or '..' in rel.split('/'):
        return None

    media_root = Path(settings.MEDIA_ROOT).resolve()
    candidate = (media_root / rel).resolve()

    try:
        candidate.relative_to(media_root)
    except ValueError:
        return None

    if not candidate.is_file():
        return None

    return candidate


@extend_schema(
    tags=['Universities'],
    responses={200: OpenApiTypes.BINARY},
    description='Obtiene el logo de una universidad por id de universidad',
    summary='Obtener logo de universidad',
)
class UniversityImageByUniversityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, university_id):
        university = Universities.objects.select_related('image').filter(
            id=university_id,
            user=request.user,
            status=1,
            is_deleted=0,
        ).first()

        if university is None:
            return ApiResponse.error(message='Universidad no encontrada', status_code=404)

        image = university.image
        if image is None or image.is_deleted == 1:
            return ApiResponse.error(message='Imagen no encontrada', status_code=404)

        abs_path = _resolve_media_file(image.image_path)
        if abs_path is None:
            return ApiResponse.error(message='Imagen no encontrada', status_code=404)

        mime_type = (image.mime_type or 'application/octet-stream')[:100]
        filename = (image.image_name or f'university-{university.id}.{image.extension or "bin"}')[:120]

        return FileResponse(
            open(abs_path, 'rb'),
            as_attachment=False,
            filename=filename,
            content_type=mime_type,
        )


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
            },
            message='Imagen subida correctamente',
        )
