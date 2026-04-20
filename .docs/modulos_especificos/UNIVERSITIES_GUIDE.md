# Guia rapida: `universities` (Universidades), setup completo y logo privado

> **Rutas y listado completo de endpoints:** ver **`BACKEND_ENDPOINTS_POR_REALIZAR.md`**.

- **`Universities`**: datos generales de la universidad.
- **`Images`**: metadatos del logo (archivo privado).
- **`Modalities`**: modalidades academicas por universidad.
- **`Shifts`**: turnos operativos por universidad.
- **`AcademicPeriods`**: periodos academicos por universidad.

---

## 1) Modelos y relacion funcional

### `Universities` (tabla `universities`)
Define la entidad principal de universidad.

Campos importantes:
- `name`, `short_name`, `institution_code`
- `start_time`, `end_time` (ventana operativa)
- `period_type`
- `uses_period_groups` (0/1)
- `image` (FK a `images`, opcional)
- `status`, `is_deleted`

Modelo:
- `horarios_backend/universities/models/universities.py`

### `Images` (tabla `images`)
Guarda metadatos del archivo del logo (nombre, hash, mime, ruta interna, etc.).

Modelo:
- `horarios_backend/universities/models/images.py`

### `Modalities` (tabla `modalities`)
Modalidades por universidad con `configurations` JSON (`allowed_days`, `classroom_days_per_week`).

Modelo:
- `horarios_backend/careers/models/modalities.py`

### `Shifts` (tabla `shifts`)
Turnos por universidad con orden y rango horario.

Modelo:
- `horarios_backend/universities/models/shifts.py`

### `AcademicPeriods` (tabla `academic_periods`)
Periodos por universidad con orden e indicador `is_active`.

Modelo:
- `horarios_backend/universities/models/academic_periods.py`

---

## 2) Reglas de negocio clave

1. **Inmutabilidad de `uses_period_groups`**
- Se define al crear la universidad.
- Despues no se puede cambiar (ni de `1 -> 0` ni de `0 -> 1`).
- Si se intenta cambiar en update, backend responde error de validacion.

2. **Ventana operativa de universidad**
- `start_time` debe ser menor a `end_time` en universidad.

3. **Rango valido para turnos**
- Cada turno debe cumplir:
  - `shift.start_time >= university.start_time`
  - `shift.end_time <= university.end_time`
  - `shift.start_time < shift.end_time`
- Se valida en endpoints directos de turnos y tambien en setup completo.

4. **Logo privado y sin exposicion de ruta real**
- El logo se obtiene por endpoint autenticado binario.
- El upload no devuelve ruta de archivo publica.
- Al reemplazar o eliminar logo se marca la imagen previa como borrada logica (`images.is_deleted = 1`).

5. **Setup completo atomico**
- Crear/actualizar setup completo corre en transaccion atomica.
- Si falla cualquier validacion, no quedan cambios parciales persistidos.

---

## 3) Endpoints del modulo

Rutas:
- `horarios_backend/universities/urls/universities.py`

### 3.1 Universidad (principal)
- `GET /api/v1/universities/` (lista paginada)
- `POST /api/v1/universities/create/` (crear datos generales)
- `GET /api/v1/universities/{id}/` (detalle)
- `PUT /api/v1/universities/{id}/` (actualizar datos generales)
- `DELETE /api/v1/universities/{id}/` (soft delete)

### 3.2 Perfil y setup
- `GET /api/v1/universities/{id}/profile/` (datos + modalidades + turnos + periodos)
- `POST /api/setup/university-complete/` (crear setup completo)
- `PUT /api/v1/universities/{id}/full-setup/` (actualizar setup completo)

### 3.3 Logo
- `GET /api/v1/universities/{id}/image/` (binario autenticado)
- `POST /api/universities/{id}/upload-image/` (subir o reemplazar logo)
- `DELETE /api/universities/{id}/upload-image/` (quitar logo)

### 3.4 Recursos relacionados en contexto de universidad
- Modalidades: `/api/v1/university/modalities/*`
- Turnos: `/api/v1/university/shifts/*`
- Periodos academicos: `/api/v1/university/academic-periods/*`

---

## 4) Flujo recomendado de formulario (frontend)

Archivos frontend clave:
- `horarios_frontend/src/modules/user/features/universities/components/UniversityForm.jsx`
- `horarios_frontend/src/modules/user/features/universities/components/UniversityFormPageContainer.jsx`
- `horarios_frontend/src/modules/user/features/universities/hooks/useUniversities.js`
- `horarios_frontend/src/modules/user/features/universities/api/universitiesApi.js`
- `horarios_frontend/src/modules/user/features/universities/utils/universityPayloadUtils.js`
- `horarios_frontend/src/modules/user/features/universities/validations/universityValidationSchema.js`

Comportamiento implementado:
1. En creacion:
- Modalidad inicial por defecto: solo `Presencial`.
- Nuevas modalidades y turnos se insertan arriba.

2. En edicion:
- El switch de `uses_period_groups` se muestra bloqueado (solo lectura).
- El payload de edicion no intenta cambiar `uses_period_groups`.

3. Turnos:
- Inputs de hora usan `min/max` con apertura/cierre de universidad.
- Validacion local adicional antes de enviar.

---

## 5) Ejemplos de request

### A) Crear setup completo

`POST /api/setup/university-complete/`

```json
{
  "university": {
    "name": "Universidad Emiliano Zapata",
    "short_name": "UTEZ",
    "institution_code": "UTEZ001",
    "start_time": "07:00",
    "end_time": "22:00",
    "period_type": 1,
    "uses_period_groups": 1
  },
  "modalities": [
    {
      "name": "Presencial",
      "require_classroom": 1,
      "configurations": {
        "allowed_days": [1, 2, 3, 4, 5],
        "classroom_days_per_week": 5
      }
    }
  ],
  "shifts": [
    { "name": "Matutino", "start_time": "07:00", "end_time": "14:00", "order": 1 }
  ],
  "academic_periods": [
    {
      "name": "Mayo - Agosto 2026",
      "start_month": 5,
      "end_month": 8,
      "year": 2026,
      "order": 1,
      "is_active": 1
    }
  ]
}
```

### B) Actualizar setup completo (sin cambiar `uses_period_groups`)

`PUT /api/v1/universities/{id}/full-setup/`

```json
{
  "university": {
    "name": "Universidad Emiliano Zapata",
    "short_name": "UTEZ",
    "institution_code": "UTEZ001",
    "start_time": "07:00",
    "end_time": "22:00",
    "period_type": 1
  },
  "modalities": [
    {
      "id": 10,
      "name": "Presencial",
      "require_classroom": 1,
      "configurations": {
        "allowed_days": [1, 2, 3, 4, 5],
        "classroom_days_per_week": 5
      }
    }
  ],
  "shifts": [
    { "id": 21, "name": "Matutino", "start_time": "07:00", "end_time": "14:00", "order": 1 }
  ],
  "academic_periods": []
}
```

### C) Quitar logo

`DELETE /api/universities/{id}/upload-image/`

Resultado funcional:
- `universities.image = NULL`
- imagen asociada marcada como borrada logica (`images.is_deleted = 1`)

---

## 6) Archivos backend clave

- Vistas:
  - `horarios_backend/universities/views/universities.py`
  - `horarios_backend/universities/views/university_profile.py`
  - `horarios_backend/universities/views/full_universities.py`
  - `horarios_backend/universities/views/university_images.py`

- Serializers:
  - `horarios_backend/universities/serializers/universities/university_write_serializer.py`
  - `horarios_backend/universities/serializers/universities/serializer_full.py`
  - `horarios_backend/universities/serializers/shifts/shift_write_serializer.py`

- Servicios:
  - `horarios_backend/universities/services/full_setup_sync.py`

---

## 7) Nota operativa

Aunque frontend bloquea cambios de `uses_period_groups` en edicion, la garantia final esta en backend. Esto evita cambios por clientes externos o payloads manuales y mantiene consistencia historica de periodos academicos y configuracion de grupos.
