# BACKEND — Guía de Implementación de Módulos

> **Stack:** Django 6.0.1 · Django REST Framework · SimpleJWT · drf-spectacular · MySQL · BCrypt  
> **Base URL del sistema:** `http://localhost:8000/api/`  
> **Versionado por endpoint:** `v1` se define en cada ruta (por ejemplo: `/api/v1/universities/`, `/api/v1/university/subjects/`).  
> **Documentación interactiva:** `http://localhost:8000/api/docs/`

---

## 1. Estructura general del proyecto

```
horarios_backend/              ← raíz del proyecto Django
  manage.py
  .env / .env.example
  core/                        ← utilidades globales (NO en INSTALLED_APPS)
    api_response.py            ← clase ApiResponse
    exception_handler.py       ← manejo global de excepciones
        user_configuration.py      ← helpers para universidad seleccionada
        permissions.py             ← IsAdmin, RequireSelectedUniversity, decoradores
        request_decryption.py      ← decrypt_request (RSA + AES-GCM)
  horarios_backend/            ← configuración Django
    settings.py
    urls.py                    ← URL raíz del proyecto
    user_accounts/               ← app: autenticación y usuarios
    subjects/                    ← app: materias y colores (referencia implementada)
    universities/                ← app: universidades y configuración (por implementar)
    careers/                     ← app: carreras y grupos (por implementar)
    teachers/                    ← app: profesores (por implementar)
    classrooms/                  ← app: salones (por implementar)
    schedule_generator/          ← app: generacion y versionamiento de horarios
    audit/                       ← app: logs de auditoria (modelo y soporte de auditoria)
```

---

## 2. Estructura interna de cada app

Todas las apps (excepto `user_accounts` y `audit`) siguen esta estructura de carpetas:

```
{app}/
  migrations/
  models/
    __init__.py                ← exporta todos los modelos
    {modelo}.py                ← un archivo por modelo
  serializers/
    __init__.py                ← exporta todos los serializers
    {modelo}/
      __init__.py              ← exporta los 4 serializers del modelo
      {modelo}_write_serializer.py
      {modelo}_detail_serializer.py
      {modelo}_list_serializer.py
      {modelo}_select_serializer.py
  views/
    __init__.py                ← exporta todas las vistas
    {modelo}.py                ← un archivo por modelo
  urls/
    __init__.py                ← incluye todos los archivos de rutas
    {modelo}.py                ← rutas de un modelo
  admin.py
  apps.py
  tests.py
  __init__.py
```

---

## 3. Registro de apps en settings.py

Cada nueva app debe añadirse a `INSTALLED_APPS` en `horarios_backend/settings.py`:

```python
INSTALLED_APPS = [
    # ... apps de Django
    'user_accounts',
    'subjects',
    'universities',   # agregar
    'careers',        # agregar
    'teachers',       # agregar
    'classrooms',     # agregar
    'schedule_generator',
    'audit',          # agregar
]
```

Y su prefijo de URL en `horarios_backend/urls.py`:

```python
urlpatterns = [
    path('api/', include('user_accounts.urls')),
    path('api/', include('subjects.urls')),
    path('api/', include('universities.urls')),
    path('api/', include('careers.urls')),
    path('api/', include('teachers.urls')),
    path('api/', include('classrooms.urls')),
    path('api/', include('schedule_generator.urls')),
]
```

> Nota: actualmente `audit` no expone rutas API propias; el registro se realiza por triggers SQL y helpers de `core.audit_context`.

---

## 4. Patron de endpoints por modulo

Cada modulo implementa los siguientes endpoints (usando `colors` como referencia):

Convencion de rutas:
- `universities`: `/api/v1/universities/...`
- resto de modulos en contexto de universidad seleccionada: `/api/v1/university/{recurso}/...`

| Método | URL | Vista | Descripción |
|--------|-----|-------|-------------|
| `GET` | `/api/v1/{prefijo}/{recurso}/` | `{Modelo}ListView` | Lista registros no eliminados logicamente (`is_deleted = 0`). Usa serializer select para dropdowns. |
| `POST` | `/api/v1/{prefijo}/{recurso}/` | `{Modelo}ListView` | Crea un nuevo registro |
| `GET` | `/api/v1/{prefijo}/{recurso}/paginated/` | `{Modelo}PaginatedView` | Lista paginada con filtros y ordenamiento |
| `GET` | `/api/v1/{prefijo}/{recurso}/{pk}/` | `{Modelo}DetailView` | Obtiene un registro por ID (solo si `is_deleted = 0`) |
| `PUT` | `/api/v1/{prefijo}/{recurso}/{pk}/` | `{Modelo}DetailView` | Actualiza uno o varios campos |
| `DELETE` | `/api/v1/{prefijo}/{recurso}/{pk}/` | `{Modelo}DetailView` | Marca el registro como eliminado (`is_deleted = 1`) |
| `PUT` | `/api/v1/{prefijo}/{recurso}/{pk}/toggle-status/` | `{Modelo}ToggleStatusView` | Alterna `status` entre 1 y 0 |

Donde `{prefijo}` es:
- `universities` para el modulo de universidades.
- `university` para el resto de modulos en contexto.

---

## 5. Reglas de negocio globales

### Campos de ciclo de vida

Cada modelo con gestión de estado tiene **dos campos diferenciados**:

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `status` | `IntegerField` (1 / 0) | Indica si el registro está **activo** o **inactivo**. Se usa para determinar si el recurso se toma en cuenta en la **generación de horarios**. |
| `is_deleted` | `IntegerField` (1 / 0) | Indica si el registro ha sido **eliminado lógicamente**. Cuando es `1`, el registro es invisible para todos los endpoints de consulta. |

### Comportamiento por operación

- **`POST`**: crea el registro con `status = 1` e `is_deleted = 0`. Ambos valores son inyectados por el serializer; el cliente no los envía.
- **`PUT`**: acepta todos los campos como opcionales (`partial=True`). Nunca modifica `is_deleted`.
- **`DELETE`**: no elimina físicamente. Cambia `is_deleted = 1`. El registro queda oculto en todas las consultas posteriores.
- **`toggle-status`**: alterna `status` entre 1 y 0. Permite activar o desactivar un recurso para la generación de horarios sin eliminarlo. **Este endpoint existe en todos los módulos**, independientemente del nivel de permiso requerido.
- **Consultas (`GET` lista/select, `GET` paginado, `GET` por ID)**: siempre filtran por `is_deleted = 0`. Un registro con `is_deleted = 1` nunca es retornado ni accesible por ID.

- **Escalabilidad en PUT con listas completas** (por ejemplo subjects-carreras-profesores, teachers-subjects, classrooms-careers): el backend debe comparar estado actual vs payload y evitar escrituras innecesarias cuando no haya cambios efectivos (no-op).
### Campos de auditoría (managed por triggers de BD)

Los campos `created_at`, `created_by`, `updated_at` y `updated_by` son gestionados **automáticamente por triggers en MySQL**. Django **no debe tocarlos nunca**:

- No deben aparecer en ningún serializer (ni Write, ni Detail, ni List, ni Select).
- No se setean en `create()` ni en `update()` del serializer.
- No se pasan desde la vista ni desde el cliente.
- Deben declararse en el modelo Django únicamente para poder leerlos si se necesitara, pero sin `default` ni lógica Python asociada.
### Otras reglas

- El campo `is_deleted` **nunca se expone en ningún serializer** (ni Write, ni Detail, ni List). Es un campo de infraestructura interno.
- El endpoint paginado soporta `page`, `limit`, `search`, `sortBy` y `order`.
- Todos los endpoints requieren autenticación JWT (`IsAuthenticated`).
- Para módulos de **datos operativos por universidad** (materias, carreras, grupos, etc.) se debe exigir universidad seleccionada con `RequireSelectedUniversity` o `@require_selected_university(...)`.
- El permiso de universidad seleccionada **NO aplica** a:
    - `user_accounts` (auth/configuración de usuario)
    - `audit` (solo lectura de auditoría)
    - CRUDs/catálogos de sistema globales (ejemplo: `period_types`)

### Transacciones en operaciones de escritura

**Todas las operaciones de escritura (POST, PUT, DELETE, toggle-status) están protegidas por transacciones ACID** para garantizar consistencia de datos:

1. **Nivel global (`ATOMIC_REQUESTS = True`)**: Cada request HTTP se envuelve automáticamente en una transacción. Si ocurre un error en cualquier punto, se hace `ROLLBACK` completo.

2. **Nivel de método (`@transaction.atomic`)**: Los métodos `post()`, `put()`, `delete()` de cada vista están decorados explícitamente con `@transaction.atomic`. Esto asegura que:
   - Si el serializer valida OK pero la BD falla durante `save()`, se revierte todo.
   - Si hay múltiples operaciones relacionadas, todas se comiten o se revierten juntas.
   - No quedan registros en estado inconsistente.

**Ejemplo de decorador en vistas:**

```python
from django.db import transaction

class SubjectDetailView(APIView):
    @transaction.atomic
    def post(self, request):
        # Si algo falla aquí, TODO se revierte (transacción)
        serializer = SubjectWriteSerializer(data=request.data)
        if serializer.is_valid():
            subject = serializer.save()  # Base de datos
            return ApiResponse.created(SubjectDetailSerializer(subject).data)
        return ApiResponse.error(errors=serializer.errors)

    @transaction.atomic
    def put(self, request, pk):
        # Lectura, validación y escritura en transacción única
        subject = self.get_object(pk)
        if subject is None:
            return ApiResponse.not_found()
        serializer = SubjectWriteSerializer(subject, data=request.data, partial=True)
        if serializer.is_valid():
            subject = serializer.save()
            return ApiResponse.success(SubjectDetailSerializer(subject).data)
        return ApiResponse.error(errors=serializer.errors)

    @transaction.atomic
    def delete(self, request, pk):
        # Marcado lógico (soft delete) con transacción
        subject = self.get_object(pk)
        if subject is None:
            return ApiResponse.not_found()
        subject.is_deleted = 1
        subject.save()  # Dentro de transacción
        return ApiResponse.deleted('Materia eliminada correctamente')
```

**Nota:** Los `GET` (lecturas) NO tienen `@transaction.atomic` porque Django optimiza automáticamente las transacciones de solo lectura. Usar `@transaction.atomic` en lecturas impacta Performance innecesariamente.

---

## 6. Permisos por módulo

Solo los módulos indicados requieren rol de administrador en escritura. El resto solo requiere estar autenticado.

| App | Módulo | GET | POST | PUT | DELETE | toggle-status |
|-----|--------|-----|------|-----|--------|---------------|
| `subjects` | `colors` | ✅ Auth | 🔒 Admin | 🔒 Admin | 🔒 Admin | 🔒 Admin |
| `universities` | `period_types` | ✅ Auth | 🔒 Admin | 🔒 Admin | 🔒 Admin | 🔒 Admin |
| Todos los demás | todos | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth |

> **Nota:** `toggle-status` está presente en **todos los módulos sin excepción**. Es el mecanismo para controlar si un recurso participa en la generación de horarios (`status = 1`) o no (`status = 0`), independientemente de si está pendiente de eliminación.

Para aplicar el permiso de administrador sobre un método específico se usa el decorador `@require_permissions(IsAdmin)` de `core.permissions`:

```python
from core.permissions import IsAdmin, require_permissions

@require_permissions(IsAdmin)
def post(self, request):
    ...
```

### Permiso de universidad seleccionada (contexto)

Para módulos de datos asociados a una universidad, se puede aplicar de 2 formas:

1. **A nivel de clase (recomendado):**

```python
from rest_framework.permissions import IsAuthenticated
from core.permissions import RequireSelectedUniversity

class SubjectListView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]
```

2. **A nivel de método (casos puntuales):**

```python
from core.permissions import require_selected_university

@require_selected_university()
def get(self, request):
    ...
```

El decorador acepta opciones:

```python
@require_selected_university(
    message='Para realizar esta acción debe tener una universidad seleccionada',
    raise_error=True,
)
def get(self, request):
    ...
```

Notas de comportamiento:
- Cuando existe universidad seleccionada, se adjunta en `request.selected_university_id`.
- Si `raise_error=True` y no existe universidad seleccionada, retorna `400`.
- Si `raise_error=False`, no retorna error automático y el método decide qué hacer.

---

## 7. ApiResponse — respuestas estandarizadas

Importar desde `core.api_response import ApiResponse`. Todos los métodos devuelven el mismo envelope:

```json
{
  "error": false,
  "statusCode": 200,
  "message": "Operación exitosa",
  "data": { ... }
}
```

| Método | Uso | Status |
|--------|-----|--------|
| `ApiResponse.success(data, message)` | GET exitoso | 200 |
| `ApiResponse.created(data, message)` | POST exitoso | 201 |
| `ApiResponse.deleted(message)` | DELETE exitoso | 200 |
| `ApiResponse.paginated(data, page, limit, total)` | GET paginado | 200 |
| `ApiResponse.error(message, status_code, errors)` | Cualquier error | 4xx |
| `ApiResponse.not_found(message)` | Recurso no encontrado | 404 |

El método `paginated` agrega un campo extra `meta`:

```json
{
  "error": false,
  "statusCode": 200,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

## 8. Convención de serializers

Cada modelo tiene **cuatro serializers**:

| Archivo | Clase | Uso | Campos |
|---------|-------|-----|--------|
| `{modelo}_write_serializer.py` | `{Modelo}WriteSerializer` | POST / PUT | Campos editables (sin `status`, `is_deleted`, `created_at`, etc.) |
| `{modelo}_detail_serializer.py` | `{Modelo}DetailSerializer` | GET por ID, respuesta de PUT | Campos visibles del detalle |
| `{modelo}_list_serializer.py` | `{Modelo}ListSerializer` | GET paginado | Campos mínimos para tabla (`id` + campos clave) |
| `{modelo}_select_serializer.py` | `{Modelo}SelectSerializer` | GET lista (sin paginación) | Solo `id`, `name` y `short_name` (si existe). Para dropdowns/selects. |

### Serializer Select

El `SelectSerializer` es el que usa el endpoint `GET /api/v1/{prefijo}/{recurso}/` (sin paginacion). Su proposito es alimentar `<select>` y dropdowns en el frontend, por lo que solo expone los campos minimos necesarios para identificar un registro.

```python
from rest_framework import serializers
from {app}.models import {Modelo}

class {Modelo}SelectSerializer(serializers.ModelSerializer):
    """ Serializador para selects/dropdowns """
    class Meta:
        model  = {Modelo}
        fields = ('id', 'name', 'short_name')  # omitir short_name si el modelo no lo tiene
```

El endpoint lista siempre filtra por `is_deleted = 0` (no eliminado logicamente):

```python
def get(self, request):
    registros = {Modelo}.objects.filter(is_deleted=0)
    return ApiResponse.success({Modelo}SelectSerializer(registros, many=True).data)
```

**Campos que nunca deben aparecer en ningún serializer:**

| Campo | Razón |
|-------|-------|
| `is_deleted` | Campo de infraestructura interna. El front nunca lo necesita. |
| `status` | Nunca se envía en el cuerpo de escritura; se gestiona solo via `toggle-status`. Solo se puede incluir en Detail/List si el diseño lo requiere para visualización, pero **nunca en WriteSerializer**. |
| `created_at`, `created_by`, `updated_at`, `updated_by` | Gestionados por **triggers de MySQL**. Django no los toca nunca. |

El `WriteSerializer` siempre inyecta `status = 1` e `is_deleted = 0` en `create()`:

```python
def create(self, validated_data):
    validated_data['status'] = 1
    validated_data['is_deleted'] = 0
    return {Modelo}.objects.create(**validated_data)
```

---

## 9. Convención de vistas

Todas las vistas extienden `APIView` y usan `@extend_schema(tags=['{NombreModulo}'])` en la clase. Para el endpoint paginado, se declaran explícitamente los parámetros con `OpenApiParameter`:

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

@extend_schema(tags=['{NombreModulo}'])
class {Modelo}PaginatedView(APIView):
    permission_classes = [IsAuthenticated]  # o [IsAuthenticated, RequireSelectedUniversity] segun el modulo

    SORT_FIELDS = {'id', 'name', ...}  # campos permitidos de ordenamiento

    @extend_schema(
        summary='Lista paginada de {modelos}',
        description='...',
        parameters=[
            OpenApiParameter(name='page',   type=OpenApiTypes.INT, ...),
            OpenApiParameter(name='limit',  type=OpenApiTypes.INT, ...),
            OpenApiParameter(name='search', type=OpenApiTypes.STR, ...),
            OpenApiParameter(name='status', type=OpenApiTypes.STR, enum=['true','false'], required=False, ...),
            OpenApiParameter(name='sortBy', type=OpenApiTypes.STR, ...),
            OpenApiParameter(name='order',  type=OpenApiTypes.STR, enum=['ASC','DESC'], ...),
        ],
    )
    def get(self, request):
        ...
```

Para que Swagger muestre el cuerpo de `POST` y `PUT`, se debe declarar `@extend_schema(request={Modelo}WriteSerializer)` en el método:

```python
@extend_schema(request={Modelo}WriteSerializer)
def post(self, request):
    ...
```

---

## 10. Orden de implementación de apps y módulos

### App: `user_accounts` ✅ (implementada)
Modelos: `roles`, `users`

Endpoints activos:
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/register-admin/`
- `POST /api/v1/auth/verify-account/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/refresh/`
- `GET  /api/v1/user/my-info/`
- `PUT  /api/v1/user/configurations/`

> **Nota de seguridad (auth):** `login` y `register` usan `@decrypt_request()`.
> El cliente debe enviar `{ key, iv, data }`, donde:
> - `key`: llave AES cifrada con RSA-OAEP (base64)
> - `iv`: IV NO cifrado de 12 bytes para AES-GCM (serializado en base64)
> - `data`: payload cifrado con AES-GCM (base64, incluyendo tag)

Variables de entorno requeridas para descifrado en backend:
- `RSA_PRIVATE_KEY` (contenido PEM)
- `RSA_PRIVATE_KEY_PATH` (ruta al archivo PEM)

Flujo de verificacion de cuenta:
- Al registrar (`register` / `register-admin`) se crea un token en `user_tokens` con tipo `email_verification`.
- El backend envia correo automaticamente usando template Django HTML (`emails/verification_account.html`).
- `POST /api/v1/auth/verify-account/` valida token, expiracion y uso previo, marca `users.is_verificated = 1` y crea `user_configurations` por defecto (`theme=light`, `accent=blue`, `schedule_generation={"draft_schedule_university_ids":[]}`, `selected_university_id=NULL`, `status=1`).
- Si el token ya fue usado pero la cuenta ya esta verificada, `verify-account` responde exito para mantener idempotencia del flujo.
- Al verificar exitosamente, se limpian cookies `access_token` y `refresh_token` para evitar auto-login no intencional.
- `login` y cualquier endpoint autenticado rechazan usuarios con `status != 1` o `is_verificated != 1`.
- Las respuestas de `register` y `register-admin` ya no exponen el token de verificacion; solo confirman el correo destino.
- Los links de correo se construyen de forma hardcodeada por modulo usando `LINK_FRONTEND` como base.
- Los endpoints publicos de auth (`login`, `refresh`, `register`, `verify-account`, `logout`) no usan autenticacion por defecto para evitar errores por cookies access viejas o invalidas.

Variables de entorno para envio de correo:
- `EMAIL_BACKEND`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `EMAIL_USE_TLS`
- `EMAIL_USE_SSL`
- `EMAIL_TIMEOUT`
- `DEFAULT_FROM_EMAIL`
- `LINK_FRONTEND`

---

### App: `subjects` ✅ (implementada)
Modelos: `colors` ✅, `subjects` (pendiente)

Endpoints activos (`colors`):
- `GET    /api/v1/colors/`
- `POST   /api/v1/colors/`  🔒 Admin
- `GET    /api/v1/colors/paginated/`
- `GET    /api/v1/colors/{pk}/`
- `PUT    /api/v1/colors/{pk}/`  🔒 Admin
- `DELETE /api/v1/colors/{pk}/`  🔒 Admin
- `PUT    /api/v1/colors/{pk}/toggle-status/`  🔒 Admin

Modelo `subjects` (campos):
```
name, short_name, code, description, hours_per_week,
color (FK → colors), university (FK → universities), is_mandatory, status,
created_at, created_by, updated_at, updated_by
```

---

### App: `universities` (por implementar)
Modelos en orden de implementación: `images`, `period_types`, `universities`, `shifts`, `academic_periods`

**`images`**
```
image_name, mime_type, extension, sha256, file_size, data,
created_at, created_by, updated_at, updated_by
```

**`period_types`** 🔒 POST/PUT/DELETE requieren Admin
```
name, code, months_duration, status,
created_at, created_by, updated_at, updated_by
```

**`universities`**
```
name, short_name, image (FK → images), user (FK → users),
start_time, end_time, status,
created_at, created_by, updated_at, updated_by
```

**`shifts`**
```
name, university (FK → universities), order,
start_time, end_time, status,
created_at, created_by, updated_at, updated_by
```

**`academic_periods`**
```
name, university (FK → universities), period_type (FK → period_types),
start_month, end_month, order,
created_at, created_by, updated_at, updated_by
```

---

### App: `careers` (por implementar)
Modelos en orden: `careers`, `groups`, `career_subjects`, `career_period_exceptions`

**`careers`**
```
name, short_name, code, university (FK → universities),
total_periods, status,
created_at, created_by, updated_at, updated_by
```

**`groups`**
```
name, career (FK → careers), period_number, letter,
shift (FK → shifts), status,
created_at, created_by, updated_at, updated_by
```

**`career_subjects`** (tabla relacional, sin status)
```
subjects (FK → subjects), careers (FK → careers), period_number
```

**`career_period_exceptions`**
```
career (FK → careers), period_number, reason, status,
created_at, created_by, updated_at, updated_by
```

---

### App: `teachers` (por implementar)
Modelos en orden: `teachers`, `teacher_availabilities`, `teachers_subjects`, `teachers_universities`

**`teachers`**
```
name, surname, last_name, status,
created_at, created_by, updated_at, updated_by
```

**`teacher_availabilities`**
```
teacher (FK → teachers), day_of_week, start_time, end_time,
is_available, created_at, created_by, updated_at, updated_by
```

**`teachers_subjects`** (tabla relacional)
```
teachers (FK → teachers), subjects (FK → subjects)
```

**`teachers_universities`** (tabla relacional con status)
```
teachers (FK → teachers), universities (FK → universities), status
```

---

### App: `classrooms` (por implementar)
Modelos en orden: `classroom_types`, `classrooms`, `classroom_careers`

**`classroom_types`**
```
name, description, status,
created_at, created_by, updated_at, updated_by
```

**`classrooms`**
```
name, classroom_type (FK → classroom_types), code, floor,
building, building_code, is_restricted,
universities (FK → universities), status,
created_at, created_by, updated_at, updated_by
```

**`classroom_careers`** (tabla relacional)
```
careers (FK → careers), classrooms (FK → classrooms)
```

---

### App: `audit` (implementada)
Modelo principal: `audit_logs`

```
user_id, username, source, transaction_id,
table_name, record_id, action,
old_data (JSON), new_data (JSON),
ip_address, user_agent, is_succesfull, error_message, created_at
```

Comportamiento:

- Exitos de operaciones de datos: registrados por triggers MySQL.
- Errores de aplicacion en endpoints decorados: registrados desde backend con `with_audit_context(...)`, usando `is_succesfull = 0` y `error_message`.
- Acciones puntuales (ejemplo `CHANGE_STATUS`): via `with_audit_action(...)`.

Referencia completa:

- `.docs/modulos_especificos/BACKEND_AUDITORIA.md`

---

## 11. Ejemplo completo de implementación (referencia: `colors`)

### `models/colors.py`
```python
from django.db import models

class Colors(models.Model):
    name         = models.CharField(max_length=45)
    hex          = models.CharField(max_length=6)
    contrast_hex = models.CharField(max_length=6)
    status       = models.IntegerField()
    is_deleted   = models.IntegerField(default=0)
    # Campos de auditoría: gestionados por triggers de MySQL, Django no los toca
    created_at   = models.DateTimeField(blank=True, null=True)
    created_by   = models.CharField(max_length=100, blank=True, null=True)
    updated_at   = models.DateTimeField(blank=True, null=True)
    updated_by   = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed  = False
        db_table = 'colors'
```

### `serializers/colors/color_write_serializer.py`
```python
from rest_framework import serializers
from subjects.models import Colors

class ColorWriteSerializer(serializers.ModelSerializer):
    """ Serializador de escritura para Colors (POST, PUT) """
    class Meta:
        model  = Colors
        fields = ('name', 'hex', 'contrast_hex')

    def create(self, validated_data):
        validated_data['status'] = 1
        validated_data['is_deleted'] = 0
        return Colors.objects.create(**validated_data)
```

### `serializers/colors/color_detail_serializer.py`
```python
from rest_framework import serializers
from subjects.models import Colors

class ColorDetailSerializer(serializers.ModelSerializer):
    """ Serializador de detalle para Colors (GET por ID) """
    class Meta:
        model  = Colors
        fields = ('id', 'name', 'hex', 'contrast_hex')
```

### `serializers/colors/color_list_serializer.py`
```python
from rest_framework import serializers
from subjects.models import Colors

class ColorListSerializer(serializers.ModelSerializer):
    """ Serializador de listado para Colors (GET / paginado) """
    class Meta:
        model  = Colors
        fields = ('id', 'name', 'hex')
```

### `views/colors.py` (estructura completa)
```python
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q
from core.api_response import ApiResponse
from core.permissions import IsAdmin, require_permissions
from subjects.models import Colors
from subjects.serializers import ColorWriteSerializer, ColorDetailSerializer, ColorListSerializer


@extend_schema(tags=['Colors'])
class ColorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Lista los colores activos y no eliminados (para selects/dropdowns) """
        colors = Colors.objects.filter(is_deleted=0)
        return ApiResponse.success(ColorListSerializer(colors, many=True).data)

    @require_permissions(IsAdmin)
    @extend_schema(request=ColorWriteSerializer)
    def post(self, request):
        """ Crea un nuevo color """
        serializer = ColorWriteSerializer(data=request.data)
        if serializer.is_valid():
            color = serializer.save()
            return ApiResponse.created(ColorDetailSerializer(color).data)
        return ApiResponse.error(errors=serializer.errors)


@extend_schema(tags=['Colors'])
class ColorPaginatedView(APIView):
    permission_classes = [IsAuthenticated]
    SORT_FIELDS = {'id', 'name', 'hex', 'contrast_hex'}

    @extend_schema(
        summary='Lista paginada de colores',
        description='Retorna los colores de forma paginada con soporte de búsqueda, filtro por status y ordenamiento.',
        parameters=[
            OpenApiParameter('page',   OpenApiTypes.INT, OpenApiParameter.QUERY, description='Número de página (default: 1)', default=1),
            OpenApiParameter('limit',  OpenApiTypes.INT, OpenApiParameter.QUERY, description='Registros por página (default: 10)', default=10),
            OpenApiParameter('search', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Buscar en nombre o hex', required=False),
            OpenApiParameter('status', OpenApiTypes.STR, OpenApiParameter.QUERY, description='true (activos) / false (inactivos). Sin valor: todos los no eliminados.', enum=['true','false'], required=False),
            OpenApiParameter('sortBy', OpenApiTypes.STR, OpenApiParameter.QUERY, description='Campo: id, name, hex, contrast_hex', default='id', required=False),
            OpenApiParameter('order',  OpenApiTypes.STR, OpenApiParameter.QUERY, description='ASC o DESC', enum=['ASC','DESC'], default='ASC', required=False),
        ],
    )
    def get(self, request):
        """ Lista paginada de colores con búsqueda, filtro por status y ordenamiento """
        page         = max(1, int(request.query_params.get('page', 1)))
        limit        = max(1, int(request.query_params.get('limit', 10)))
        search       = request.query_params.get('search', '').strip()
        status_param = request.query_params.get('status', None)
        sort_by      = request.query_params.get('sortBy', 'id')
        order        = request.query_params.get('order', 'ASC').upper()
        offset       = (page - 1) * limit

        if sort_by not in self.SORT_FIELDS:
            sort_by = 'id'
        order_field = sort_by if order == 'ASC' else f'-{sort_by}'

        queryset = Colors.objects.filter(is_deleted=0)

        if status_param is not None:
            queryset = queryset.filter(status=1 if status_param.lower() == 'true' else 0)

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(hex__icontains=search))

        queryset = queryset.order_by(order_field)
        total = queryset.count()

        return ApiResponse.paginated(
            data=ColorListSerializer(queryset[offset:offset + limit], many=True).data,
            page=page, limit=limit, total=total,
        )


@extend_schema(tags=['Colors'])
class ColorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """ Busca un color no eliminado por su ID, retorna None si no existe o fue eliminado """
        try:
            return Colors.objects.get(pk=pk, is_deleted=0)
        except Colors.DoesNotExist:
            return None

    def get(self, request, pk):
        """ Obtiene un color por ID """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        return ApiResponse.success(ColorDetailSerializer(color).data)

    @require_permissions(IsAdmin)
    @extend_schema(request=ColorWriteSerializer)
    def put(self, request, pk):
        """ Actualiza uno o varios campos """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        serializer = ColorWriteSerializer(color, data=request.data, partial=True)
        if serializer.is_valid():
            color = serializer.save()
            return ApiResponse.success(ColorDetailSerializer(color).data, message='Color actualizado exitosamente')
        return ApiResponse.error(errors=serializer.errors)

    @require_permissions(IsAdmin)
    def delete(self, request, pk):
        """ Eliminación lógica: marca is_deleted = True """
        color = self.get_object(pk)
        if color is None:
            return ApiResponse.not_found()
        color.is_deleted = 1
        color.save()
        return ApiResponse.deleted('Color eliminado exitosamente')


@extend_schema(tags=['Colors'])
class ColorToggleStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @require_permissions(IsAdmin)
    def put(self, request, pk):
        """ Alterna el status entre 1 y 0 (activo/inactivo para generación de horarios) """
        try:
            color = Colors.objects.get(pk=pk, is_deleted=0)
        except Colors.DoesNotExist:
            return ApiResponse.not_found()
        color.status = 0 if color.status == 1 else 1
        color.save()
        estado = 'activado' if color.status == 1 else 'desactivado'
        return ApiResponse.success(
            data=ColorDetailSerializer(color).data,
            message=f'Color {estado} exitosamente',
        )
```

### `urls/colors.py`
```python
from django.urls import path
from subjects.views import ColorListView, ColorPaginatedView, ColorDetailView, ColorToggleStatusView

urlpatterns = [
    path('colors/',                       ColorListView.as_view()),
    path('colors/paginated/',             ColorPaginatedView.as_view()),
    path('colors/<int:pk>/',              ColorDetailView.as_view()),
    path('colors/<int:pk>/toggle-status/', ColorToggleStatusView.as_view()),
]
```

### `urls/__init__.py`
```python
from django.urls import path, include

urlpatterns = [
    path('', include('subjects.urls.colors')),
    # path('', include('subjects.urls.subjects')),  # cuando se implemente
]
```

---

## 12. Checklist al implementar un nuevo módulo

- [ ] Crear `models/{modelo}.py` y exportar en `models/__init__.py`
- [ ] Crear migraciones: `python manage.py makemigrations {app}` y `python manage.py migrate`
- [ ] Crear `serializers/{modelo}/` con los cuatro serializers (Write, Detail, List, Select) y su `__init__.py`
- [ ] Exportar serializers en `serializers/__init__.py`
- [ ] Crear `views/{modelo}.py` con las 4 clases de vista
- [ ] **Agregar transacciones en vistas de escritura:**
    - [ ] Importar: `from django.db import transaction`
    - [ ] Decorar métodos `post()`, `put()`, `delete()`, `toggle-status put()` con `@transaction.atomic`
    - [ ] NO decorar métodos `get()` (son optimizados automáticamente)
- [ ] Definir si el módulo requiere contexto de universidad seleccionada:
    - Si **sí**, usar `RequireSelectedUniversity` en `permission_classes` (recomendado) o `@require_selected_university(...)` por método
    - Si **no** (ej. `user_accounts`, `audit`, catálogos de sistema como `period_types`), dejar solo los permisos que correspondan
- [ ] Exportar vistas en `views/__init__.py`
- [ ] Crear `urls/{modelo}.py` con las 4 rutas
- [ ] Agregar `include` en `urls/__init__.py`
- [ ] Si se usó alguna librería nueva que requiera instalación, agregarla a `horarios_backend/requirements.txt` con su versión exacta (`pip show <libreria>` para consultarla)
- [ ] Verificar con `python manage.py check`
- [ ] Confirmar que aparecen en Swagger: `http://localhost:8000/api/docs/`

