from rest_framework import serializers

_MAX_IMAGE_BYTES = 5 * 1024 * 1024
_ALLOWED_IMAGE_TYPES = frozenset(
    {
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    }
)


class UploadImageSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, value):
        if value.size > _MAX_IMAGE_BYTES:
            raise serializers.ValidationError(
                'El archivo supera el tamaño máximo permitido (5 MB).'
            )
        ct = (getattr(value, 'content_type', None) or '').lower().strip()
        if ct not in _ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                'Tipo de archivo no permitido. Use JPEG, PNG, GIF o WebP.'
            )
        return value
