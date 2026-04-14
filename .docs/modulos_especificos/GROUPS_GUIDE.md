# Guia rapida: `groups` (Grupos)

> **Rutas y listado completo de endpoints:** ver **`BACKEND_ENDPOINTS_POR_REALIZAR.md`** (referencia unica del proyecto).

- **`Groups`**: grupos academicos por carrera, periodo y turno.
- Usa **borrado logico** (`is_deleted`) y activacion/desactivacion (`status`).
- Se acota siempre a la **universidad seleccionada** via `RequireSelectedUniversity`.

---

## 1) Modelo y campos clave

Modelo:
- `horarios_backend/careers/models/groups.py`

Tabla:
- `groups`

Campos importantes:
- `name`: nombre del grupo.
- `career`: FK a carrera.
- `period_number`: numero de periodo del grupo.
- `letter`: letra del grupo.
- `shift`: FK a turno.
- `academic_period`: FK opcional a periodo academico (se controla por regla de `uses_period_groups`).
- `university`: FK a universidad.
- `status`: 1 activo / 0 inactivo.
- `is_deleted`: 0 visible / 1 eliminado logico.

---

## 2) Reglas de negocio de periodos (`uses_period_groups`)

La bandera `universities.uses_period_groups` controla 2 comportamientos:

1. **Alcance por periodo activo (lecturas y operaciones por id):**
- Si `uses_period_groups = 1`, solo se devuelven grupos del periodo academico activo (`academic_period.is_active = 1`, no eliminado, misma universidad).
- Si `uses_period_groups = 0`, no se aplica ese filtro y se devuelven todos los grupos de la universidad (respetando `is_deleted` y filtros del endpoint).
- Esta regla aplica en:
  - `GET /api/v1/university/groups/`
  - `GET /api/v1/university/groups/paginated/`
  - `GET /api/v1/university/groups/{id}/`
  - `PUT /api/v1/university/groups/{id}/`
  - `DELETE /api/v1/university/groups/{id}/`
  - `PUT /api/v1/university/groups/{id}/toggle-status/`

2. **Escritura (POST y PUT):**
- Si `uses_period_groups = 1`, el backend **siempre** asigna `academic_period` al periodo activo de la universidad.
- Si `uses_period_groups = 0`, el backend **siempre** normaliza `academic_period = null`.

Nota:
- Si `uses_period_groups = 1` y no existe periodo activo, la operacion falla con error de validacion.

---

## 3) Endpoints del modulo

Rutas definidas en:
- `horarios_backend/careers/urls/groups.py`

Base real (por `horarios_backend/horarios_backend/urls.py`):
- prefijo `/api/`

Endpoints:
- `GET /api/v1/university/groups/`
- `POST /api/v1/university/groups/`
- `GET /api/v1/university/groups/paginated/`
- `GET /api/v1/university/groups/{id}/`
- `PUT /api/v1/university/groups/{id}/`
- `DELETE /api/v1/university/groups/{id}/`
- `PUT /api/v1/university/groups/{id}/toggle-status/`

---

## 4) Flujo de lectura (GET)

### 4.1 Listado simple (para selects)
Vista:
- `GroupListView.get` en `horarios_backend/careers/views/groups.py`

Pasos:
1. Toma `selected_university_id` desde el request.
2. Construye queryset base con `status=1`, `is_deleted=0` y universidad seleccionada.
3. Aplica scope condicional de periodo activo con `_apply_active_period_scope_if_needed(...)`.
4. Ordena y retorna lista.

### 4.2 Paginado
Vista:
- `GroupPaginatedView.get` en `horarios_backend/careers/views/groups.py`

Pasos:
1. Toma `selected_university_id` desde el request.
2. Construye queryset base por universidad y `is_deleted=0`.
3. Aplica scope condicional de periodo activo con `_apply_active_period_scope_if_needed(...)`.
4. Aplica filtros opcionales (`status`, `career_id`, `search`) y ordenamiento.
5. Retorna respuesta paginada.

### 4.3 Detalle por id (findById)
Vista:
- `GroupDetailView.get` en `horarios_backend/careers/views/groups.py`

Pasos:
1. Busca por `pk`, `is_deleted=0`, y universidad seleccionada.
2. Para `GET` aplica `apply_period_scope=True`.
3. Si no existe, responde not found.
4. Si existe, serializa con `GroupDetailSerializer`.

`GroupDetailSerializer` incluye:
- `academic_period_id`
- `academic_period_name`

Archivo:
- `horarios_backend/careers/serializers/groups/group_detail_serializer.py`

---

## 5) Flujo de escritura (POST / PUT)

Serializer de entrada:
- `GroupWriteSerializer`
- Archivo: `horarios_backend/careers/serializers/groups/group_write_serializer.py`

Validaciones principales:
1. Existe `selected_university_id` en contexto.
2. Universidad existe.
3. `career` y `shift` pertenecen a la universidad seleccionada.
4. Regla `uses_period_groups`:
- `false` -> fuerza `attrs['academic_period'] = None`.
- `true` -> busca periodo activo (`is_active=1`, `is_deleted=0`) y fuerza `attrs['academic_period'] = active_period`.
- Si no hay periodo activo -> error.

Alcance adicional en `PUT`:
- Antes de actualizar, la vista aplica el mismo scope por periodo activo en el grupo objetivo.
- Si `uses_period_groups=1` y el grupo no pertenece al periodo activo, responde `404 not found`.

### Garantia para POST y PUT
Debido a esa validacion:
- En `POST`, el registro nuevo queda con `academic_period_id` activo cuando `uses_period_groups=1`.
- En `PUT` (incluso parcial), el registro queda con `academic_period_id` activo cuando `uses_period_groups=1`.
- Si `uses_period_groups=0`, el campo queda `null`.

---

## 6) Alcance para DELETE y toggle-status

Vistas:
- `GroupDetailView.delete`
- `GroupToggleStatusView.put`

Regla:
- Si `uses_period_groups=1`, solo permiten operar sobre grupos del periodo activo.
- Si `uses_period_groups=0`, permiten operar sobre cualquier grupo de la universidad (no eliminado).

---

## 6) Parametros del endpoint paginado

Endpoint:
- `GET /api/v1/university/groups/paginated/`

Query params soportados:
- `page` (default 1)
- `limit` (default 10)
- `search`
- `career_id`
- `status` (`true` / `false`)
- `sortBy` (`id`, `name`, `period_number`, `letter`, `status`, `career_id`)
- `order` (`ASC` / `DESC`)

---

## 7) Ejemplos rapidos

### 7.1 POST (uses_period_groups=true)
Request:

```json
{
  "name": "3A",
  "career": 4,
  "period_number": 3,
  "letter": "A",
  "shift": 2
}
```

Resultado esperado:
- Se crea el grupo.
- `academic_period_id` queda igual al periodo activo de la universidad seleccionada.

### 7.2 PUT parcial (uses_period_groups=true)
Request:

```json
{
  "name": "3B"
}
```

Resultado esperado:
- Se actualiza nombre.
- `academic_period_id` se mantiene/ajusta al periodo activo actual (no queda null).

### 7.3 Error por falta de periodo activo
Condicion:
- `uses_period_groups=true`
- no existe periodo activo en `academic_periods`

Respuesta esperada (400):

```json
{
  "academic_period": "No existe un periodo academico activo para la universidad seleccionada."
}
```

---

## 8) Archivos clave del modulo

- Vistas:
  - `horarios_backend/careers/views/groups.py`
- Serializers:
  - `horarios_backend/careers/serializers/groups/group_write_serializer.py`
  - `horarios_backend/careers/serializers/groups/group_detail_serializer.py`
  - `horarios_backend/careers/serializers/groups/group_list_serializer.py`
- Modelo:
  - `horarios_backend/careers/models/groups.py`
- Rutas:
  - `horarios_backend/careers/urls/groups.py`
