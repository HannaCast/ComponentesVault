# Guía rápida: `careers` (Carreras) y sus “intercepciones”

> **Rutas y listado completo de endpoints:** ver **`BACKEND_ENDPOINTS_POR_REALIZAR.md`** (referencia única del proyecto).

- **`Careers`**: la carrera (ej. DSM, ADE, etc.)
- **`CareerSubjects`**: materias que pertenecen a una carrera y el periodo en que se imparten
- **`CareerPeriodExceptions`**: periodos donde **no** se genera horario (ej. estadía)

---

## 1) ¿Qué problema resuelve cada modelo?

### `Careers` (tabla `careers`)
Representa una **carrera** que ofrece una universidad.

Campos importantes:
- **`name`**: nombre completo (ej. “Desarrollo de Software Multiplataforma”)
- **`short_name`**: abreviación (ej. “DSM”)
- **`code`**: código (ej. “DSM-01”)
- **`modality`**: modalidad (presencial, etc.)
- **`total_periods`**: número total de periodos (cuatrimestres/semestres)
- **`status`**: 1 activo / 0 inactivo
- **`is_deleted`**: 0 visible / 1 eliminado lógico (no se borra físicamente)

Archivo del modelo:
- `horarios_backend/careers/models/careers.py`

---

### `CareerSubjects` (tabla `career_subjects`)
Relaciona una **materia** con una **carrera** e indica **en qué periodo** se cursa.

Piensa en esta tabla como una lista de “materias del plan”:

- Carrera DSM
  - Periodo 1 → Programación I
  - Periodo 1 → Matemáticas
  - Periodo 2 → Programación II

Campos importantes:
- **`careers`**: FK a `Careers` (la carrera)
- **`subjects`**: FK a `Subjects` (la materia)
- **`period_number`**: número de periodo donde se imparte
- **`is_deleted`**: borrado lógico de la relación

Archivo del modelo:
- `horarios_backend/careers/models/career_subjects.py`

---

### `CareerPeriodExceptions` (tabla `career_period_exceptions`)
Define periodos de una carrera donde **no** se genera horario (ej. estadía, prácticas profesionales).

Ejemplo:
- Carrera DSM tiene 9 periodos
- El periodo 9 es “estadía” → no hay materias/horarios que generar

Campos importantes:
- **`career`**: FK a `Careers`
- **`period_number`**: el periodo que se “salta”
- **`reason`**: texto (ej. “Estadía profesional”)
- **`status`**: 1 activo / 0 inactivo (si desactivas la excepción, vuelve a contar para generación)
- **`is_deleted`**: borrado lógico

Archivo del modelo:
- `horarios_backend/careers/models/career_period_exceptions.py`

---

## 2) ¿Qué significa `status` e `is_deleted`?

En este backend se usa el patrón de **ciclo de vida** descrito en `.docs/BACKEND_IMPLEMENTATION_GUIDE.md`:

- **`status`**:
  - `1` = activo (sí cuenta para generación / aparece como activo)
  - `0` = inactivo (no cuenta, pero sigue existiendo)
- **`is_deleted`**:
  - `0` = visible
  - `1` = eliminado lógico (no debería aparecer en listados ni ser accesible por ID)

Esto evita borrar físicamente registros y mantiene integridad histórica.

---

## 3) ¿Cómo se conectan estos modelos? (Relación mental)

```text
Universities 1 ---- * Careers
Modalities   1 ---- * Careers

Careers 1 ---- * CareerSubjects   (* también apunta a Subjects)
Careers 1 ---- * CareerPeriodExceptions
```

En Django, una FK significa:
- “Una carrera pertenece a una universidad”
- “Una carrera tiene muchas excepciones”
- “Una carrera tiene muchas materias (a través de CareerSubjects)”

---

## 4) Endpoints de `Careers`

### 4.1 GET (para selects)
`GET /api/v1/university/careers/`

Devuelve carreras activas (`status=1`) y no eliminadas (`is_deleted=0`) de la **universidad seleccionada**.

Esto se usa típicamente para dropdowns en frontend.

---

### 4.2 POST / PUT (carrera + excepciones en una sola petición)
`POST /api/v1/university/careers/`
`PUT /api/v1/university/careers/{id}/`

El endpoint principal de carreras permite enviar el arreglo `period_exceptions`
en la misma petición para crear o actualizar de forma transaccional.

Flujo del código (simplificado):
1. La vista arma el serializer (`CareerWriteSerializer`) con `request.data`.
2. El serializer valida:
  - universidad seleccionada y modalidad,
  - `total_periods > 0`,
  - excepciones sin duplicados y dentro del rango permitido.
3. En `create()`/`update()`:
  - persiste carrera,
  - sincroniza `period_exceptions` (lista completa enviada),
  - todo con transacción.

Archivo de la vista:
- `horarios_backend/careers/views/careers.py` (`CareerListView.post`, `CareerDetailView.put`)

Serializer usado:
- `horarios_backend/careers/serializers/careers/career_write_serializer.py`

#### ¿Qué pasa si NO mandas excepciones?
No pasa nada: puedes omitir `period_exceptions` o mandarlo como `[]`.
- La carrera se crea/actualiza normal.
- Si se envía en `PUT`, el backend sincroniza la lista completa recibida.

---

### 4.3 Detalle por ID y consumo en frontend
`GET /api/v1/university/careers/{id}/`

El detalle regresa `period_exceptions` dentro de la misma respuesta, incluyendo `id`
y `career_id` por elemento. Con esto, frontend puede visualizar/editar sin una
segunda consulta a `career-period-exceptions`.

---

### 4.4 GET paginado / GET por ID / PUT / DELETE / toggle-status
Estos siguen el patrón estándar del proyecto:

- **GET paginado**: `.../careers/paginated/`
- **GET por ID**: `.../careers/{id}/`
- **PUT**: actualiza parcialmente (`partial=True`)
- **DELETE**: marcado lógico (`is_deleted = 1`)
- **toggle-status**: alterna `status` 1↔0

En `GET por ID`, `data.period_exceptions` incluye elementos con esta forma:

```json
{
  "id": 3,
  "career_id": 11,
  "period_number": 9,
  "reason": "Estadía profesional"
}
```

Archivos:
- Vista: `horarios_backend/careers/views/careers.py`
- Rutas: `horarios_backend/careers/urls/careers.py`

---

## 4.5 Ejemplos listos para copiar (request/response)

> Nota: todas las respuestas van envueltas por `ApiResponse` con la forma:
> `error`, `statusCode`, `message`, `data` (y a veces `meta`).

### A) POST simple (crear carrera sin excepciones)

**Request**

`POST /api/v1/university/careers/`

```json
{
  "name": "Administración de Empresas",
  "short_name": "ADE",
  "code": "ADE-01",
  "modality": 1,
  "total_periods": 9
}
```

**Response (ejemplo)**

```json
{
  "error": false,
  "statusCode": 201,
  "message": "Recurso creado exitosamente",
  "data": {
    "id": 10,
    "name": "Administración de Empresas",
    "short_name": "ADE",
    "code": "ADE-01",
    "university": "UTEZ",
    "modality": "Presencial",
    "total_periods": 9,
    "status": 1
  }
}
```

### B) POST compuesto (crear carrera + excepciones)

**Request**

`POST /api/v1/university/careers/`

```json
{
  "name": "Desarrollo de Software Multiplataforma",
  "short_name": "DSM",
  "code": "DSM-01",
  "modality": 1,
  "total_periods": 9,
  "period_exceptions": [
    { "period_number": 9, "reason": "Estadía profesional" }
  ]
}
```

**Response (ejemplo)**

```json
{
  "error": false,
  "statusCode": 201,
  "message": "Recurso creado exitosamente",
  "data": {
    "id": 11,
    "name": "Desarrollo de Software Multiplataforma",
    "short_name": "DSM",
    "code": "DSM-01",
    "university": "UTEZ",
    "modality": "Presencial",
    "total_periods": 9,
    "status": 1,
    "period_exceptions": [
      {
        "id": 3,
        "career_id": 11,
        "period_number": 9,
        "reason": "Estadía profesional"
      }
    ]
  }
}
```

### C) POST compuesto sin excepciones (válido)

**Request**

```json
{
  "name": "Ingeniería en Datos",
  "short_name": "ID",
  "code": "ID-01",
  "modality": 1,
  "total_periods": 9,
  "period_exceptions": []
}
```

**Response (ejemplo)**

```json
{
  "error": false,
  "statusCode": 201,
  "message": "Recurso creado exitosamente",
  "data": {
    "id": 12,
    "name": "Ingeniería en Datos",
    "short_name": "ID",
    "code": "ID-01",
    "university": "UTEZ",
    "modality": "Presencial",
    "total_periods": 9,
    "status": 1,
    "period_exceptions": []
  }
}
```

### D) Error típico: `period_number` fuera de rango

Si mandas una excepción con `period_number > total_periods`, el backend responde 400:

```json
{
  "error": true,
  "statusCode": 400,
  "message": "Ha ocurrido un error",
  "data": {
    "period_exceptions": "period_number fuera de rango. Debe ser <= total_periods (9)."
  }
}
```

### E) Error típico: periodos duplicados dentro del arreglo

```json
{
  "error": true,
  "statusCode": 400,
  "message": "Ha ocurrido un error",
  "data": {
    "period_exceptions": "Periodos duplicados en la petición: [9]"
  }
}
```

---

## 5) Endpoints de “intercepción” (CareerSubjects / CareerPeriodExceptions)

### 5.1 CareerSubjects
Sirve para construir el “plan” de materias por periodo.

La app expone endpoints para:
- listar relaciones
- obtener detalle por id
- crear relación
- eliminar (soft delete)

Archivos:
- Vista: `horarios_backend/careers/views/career_subjects.py`
- Rutas: `horarios_backend/careers/urls/career_subjects.py`

Validaciones típicas:
- que `career` exista
- que `subject` exista
- que pertenezcan a la universidad seleccionada

---

### 5.2 CareerPeriodExceptions
Sirve para decir “este periodo no genera horario”.

Archivos:
- Vista: `horarios_backend/careers/views/career_period_exceptions.py`
- Rutas: `horarios_backend/careers/urls/career_period_exceptions.py`

---

## 6) Tips para alguien nuevo en DRF: ¿dónde vive la lógica?

- **Models (`models/*.py`)**: describen la tabla y relaciones (qué campos hay).
- **Serializers (`serializers/*.py`)**:
  - validan datos de entrada
  - transforman datos de salida
  - pueden “inyectar” valores que el frontend no manda (ej. `status=1`).
- **Views (`views/*.py`)**:
  - reciben requests HTTP
  - llaman serializers y modelos
  - devuelven respuestas consistentes con `ApiResponse`.
- **Urls (`urls/*.py`)**:
  - conectan rutas (URL) con vistas.

