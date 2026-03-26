import base64
import json
import os
from functools import lru_cache, wraps

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding as asym_padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from loguru import logger

from core.api_response import ApiResponse


_DECRYPT_ERROR_MESSAGE = 'No fue posible desencriptar la informacion de la solicitud'


def _b64decode(value: str) -> bytes:
    """Decodifica base64 (standard/urlsafe) con relleno flexible."""
    raw = value.strip()
    missing_padding = len(raw) % 4
    if missing_padding:
        raw += '=' * (4 - missing_padding)

    try:
        return base64.b64decode(raw)
    except Exception:
        return base64.urlsafe_b64decode(raw)


@lru_cache(maxsize=1)
def _load_rsa_private_key():
    """
    Carga y cachea la llave privada RSA desde:
    - RSA_PRIVATE_KEY      → contenido PEM directo en variable de entorno
    - RSA_PRIVATE_KEY_PATH → ruta a archivo .pem

    Se ejecuta solo una vez gracias a lru_cache.
    """
    pem = os.getenv('RSA_PRIVATE_KEY')
    key_path = os.getenv('RSA_PRIVATE_KEY_PATH')

    if pem:
        pem_bytes = pem.encode('utf-8')
    elif key_path and os.path.exists(key_path):
        with open(key_path, 'rb') as key_file:
            pem_bytes = key_file.read()
    else:
        raise ValueError('No se encontro configuracion RSA_PRIVATE_KEY o RSA_PRIVATE_KEY_PATH')

    return load_pem_private_key(pem_bytes, password=None)


def _decrypt_aes_key(encrypted_key: bytes) -> bytes:
    """
    Descifra la llave AES con RSA-OAEP (SHA-256).
    Se eliminó el fallback a PKCS1v15 — es vulnerable al ataque Bleichenbacher.
    Si el frontend siempre usa OAEP, este fallback nunca debería ejecutarse.
    """
    private_key = _load_rsa_private_key()

    return private_key.decrypt(
        encrypted_key,
        asym_padding.OAEP(
            mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )


def _decrypt_data(aes_key: bytes, iv: bytes, encrypted_data: bytes) -> dict:
    """
    Descifra payload con AES-GCM y retorna JSON dict.

    AES-GCM a diferencia de AES-CBC:
    - No requiere padding (PKCS7)
    - Autentica la integridad del mensaje con un tag de 16 bytes
    - IV de 12 bytes (no 16)

    Los últimos 16 bytes de encrypted_data son el tag de autenticación
    que WebCrypto (frontend) agrega automáticamente al cifrar.
    Si alguien modificó el payload en tránsito, la verificación del tag
    lanza InvalidTag y el request es rechazado antes de descifrar.
    """
    if len(iv) != 12:
        raise ValueError('El IV debe tener exactamente 12 bytes para AES-GCM')

    # Separar ciphertext y tag de autenticación (últimos 16 bytes)
    tag = encrypted_data[-16:]
    ciphertext = encrypted_data[:-16]

    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
    decryptor = cipher.decryptor()

    # Sin unpadder — GCM no usa padding
    plain_bytes = decryptor.update(ciphertext) + decryptor.finalize()

    decoded = plain_bytes.decode('utf-8')
    payload = json.loads(decoded)

    if not isinstance(payload, dict):
        raise ValueError('El contenido desencriptado debe ser un objeto JSON')

    return payload


def decrypt_request(message: str = _DECRYPT_ERROR_MESSAGE):
    """
    Decorador para descifrar requests con estructura:

    {
      "key":  "...",   # Llave AES cifrada con RSA-OAEP    (base64)
      "iv":   "...",   # IV de 12 bytes                    (base64)
      "data": "..."    # Payload cifrado con AES-GCM        (base64, incluye tag)
    }

    Reemplaza request.data con el JSON descifrado para que el
    serializer de DRF lo reciba de forma transparente.

    Uso:
        @decrypt_request()
        def post(self, request): ...

        @decrypt_request(message='Error personalizado')
        def post(self, request): ...
    """

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            try:
                encrypted_key_b64  = request.data.get('key')
                iv_b64             = request.data.get('iv')
                encrypted_data_b64 = request.data.get('data')

                if not encrypted_key_b64 or not iv_b64 or not encrypted_data_b64:
                    return ApiResponse.error(
                        message='La solicitud no puede ser procesada correctamente',
                        status_code=400,
                    )

                # Decodificar los tres componentes base64
                encrypted_key  = _b64decode(encrypted_key_b64)
                iv             = _b64decode(iv_b64)
                encrypted_data = _b64decode(encrypted_data_b64)

                # Descifrar llave AES con RSA, luego payload con AES-GCM
                aes_key           = _decrypt_aes_key(encrypted_key)
                decrypted_payload = _decrypt_data(aes_key, iv, encrypted_data)

                # DRF cachea la data parseada — actualizamos todos los caches
                # para que request.data devuelva el payload ya descifrado
                request._full_data          = decrypted_payload
                request._data               = decrypted_payload
                request._request._body      = json.dumps(decrypted_payload).encode('utf-8')
                request._request._post      = decrypted_payload

            except Exception as e:
                logger.error(f'Error al descifrar request en {func.__qualname__}: {e}')
                return ApiResponse.error(message=message, status_code=400)

            return func(self, request, *args, **kwargs)

        return wrapper

    return decorator