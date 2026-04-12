from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from universities.models import Universities


def _public_media_path(image_path: str) -> str:
    """Ruta URL bajo MEDIA_URL, p.ej. /media/images/archivo.png."""
    rel = (image_path or '').strip().lstrip('/')
    if not rel:
        return ''
    base = settings.MEDIA_URL.rstrip('/')
    return f'{base}/{rel}'


def _media_file_exists(image_path: str) -> bool:
    """
    Comprueba que el fichero exista bajo MEDIA_ROOT.
    Evita URLs rotas cuando en BD quedan rutas antiguas (p. ej. universities/…)
    o archivos borrados manualmente.
    """
    rel = (image_path or '').strip().replace('\\', '/').lstrip('/')
    if not rel or '..' in rel.split('/'):
        return False
    root = Path(settings.MEDIA_ROOT).resolve()
    candidate = (root / rel).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return False
    return candidate.is_file()


class UniversityWriteSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Universities
        fields = (
            'id',
            'name',
            'short_name',
            'institution_code',
            'image',
            'image_url',
            'start_time',
            'end_time',
            'period_type',
            'uses_period_groups',
        )

    def get_image_url(self, obj):
        img = getattr(obj, 'image', None)
        if img is None:
            return None
        path = getattr(img, 'image_path', None)
        if not path:
            return None
        if not _media_file_exists(path):
            return None
        url_path = _public_media_path(path)
        if not url_path:
            return None
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(url_path)
        return url_path

    def create(self, validated_data):
        validated_data['uses_period_groups'] = validated_data.get('uses_period_groups', 0)
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Universities.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if self.instance is not None:
            if start_time is None:
                start_time = self.instance.start_time
            if end_time is None:
                end_time = self.instance.end_time

        if (
            start_time is not None
            and end_time is not None
            and start_time >= end_time
        ):
            raise serializers.ValidationError(
                "La hora de inicio debe ser menor que la hora de fin"
            )

        return data


