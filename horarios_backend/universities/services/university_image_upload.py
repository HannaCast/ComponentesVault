import hashlib
import os
import re
import uuid
from typing import Tuple

from django.conf import settings

_MIME_TO_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
}


def safe_storage_basename(content_type: str, original_name: str) -> Tuple[str, str]:
    """
    Retorna (nombre_en_disco, extensión_sin_punto) seguro y único.
    `original_name` solo influye en la extensión de respaldo si el MIME no es conocido.
    """
    ct = (content_type or '').lower().strip()
    ext = _MIME_TO_EXT.get(ct)
    if not ext:
        base = os.path.basename(original_name or '')
        _, dot_ext = os.path.splitext(base)
        ext = re.sub(r'[^a-zA-Z0-9]', '', dot_ext.lstrip('.')).lower()[:10] or 'bin'
    storage = f'{uuid.uuid4().hex}.{ext}'
    return storage, ext


def display_image_name(original_name: str, max_len: int = 45) -> str:
    base = os.path.basename(original_name or 'upload')
    safe = re.sub(r'[^a-zA-Z0-9._-]', '_', base).strip('._') or 'image'
    return safe[:max_len]


def sha256_file_chunks(uploaded_file) -> str:
    h = hashlib.sha256()
    for chunk in uploaded_file.chunks():
        h.update(chunk)
    uploaded_file.seek(0)
    return h.hexdigest()


def media_path_for_images(filename: str) -> Tuple[str, str]:
    """(ruta_absoluta, ruta_relativa tipo images/xxx)"""
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'images')
    os.makedirs(upload_dir, exist_ok=True)
    abs_path = os.path.join(upload_dir, filename)
    rel_path = f'images/{filename}'
    return abs_path, rel_path
