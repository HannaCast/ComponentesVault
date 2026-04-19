# API Endpoints - Sistema de Gestion de Horarios Academicos

## Convenciones generales

- **Base URL del sistema:** `/api/`
- **Versionado por endpoint (no por base):** los endpoints se publican por version, por ejemplo `/api/v1/universities/`, `/api/v1/university/subjects/`, etc.
- **Contexto de universidad:** se obtiene del `selected_university_id` de la configuracion del usuario autenticado (via token). No se pasa en la URL salvo casos especificos.
- **Nomenclatura de rutas:**
  - Modulo de universidades: `universities/`
  - Resto de modulos en contexto: `university/{resource}/`
- **Regla de borrado logico para lecturas:** todos los endpoints de lectura (`selects`, `paginated` y `findByID`) solo deben devolver registros que no esten eliminados logicamente (`is_deleted != true` / `is_deleted = 0`).
- **Patron estandar por recurso:**
  - `GET /resource/` -> Retorna **todos** los registros sin paginar (para alimentar `<select>` / dropdowns en formularios).
  - `GET /resource/paginated/` -> Retorna registros **paginados con filtros** (para las vistas de lista).
  - `POST /resource/` -> Crear.
  - `GET /resource/{pk}/` -> Detalle.
  - `PUT /resource/{pk}/` -> Actualizar.
  - `PUT /resource/{pk}/toggle-status/` -> Activar / desactivar.
  - `DELETE /resource/{pk}/` -> Soft delete.
- **Regla de escalabilidad para PUT con listas completas:** en recursos que actualizan colecciones relacionadas (por ejemplo `subjects`, `teachers`, `careers`, `classrooms`), el backend debe comparar estado actual vs payload y evitar escrituras innecesarias cuando no haya cambios efectivos (no-op).

---

## 1. Autenticacion

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register/` | Registrar usuario. Crea la cuenta, genera token de verificacion y envia correo. |
| `POST` | `/api/v1/auth/register-admin/` | Registrar administrador (solo admin autenticado). Genera token y envia correo de verificacion. |
| `POST` | `/api/v1/auth/verify-account/` | Verificar cuenta con token, activar `is_verificated = 1`, crear `user_configurations` por defecto e invalidar cookies de sesion. |
| `POST` | `/api/v1/auth/login/` | Iniciar sesion (email + password). Retorna token. |
| `POST` | `/api/v1/auth/refresh/` | Renovar access token usando refresh token en cookie HttpOnly. |
| `POST` | `/api/v1/auth/logout/` | Cerrar sesion. Invalida el token. |

Notas:
- `login` solo permite acceso cuando `status = 1` e `is_verificated = 1`.
- El token de verificacion se almacena en `user_tokens` con tipo `email_verification`.
- El token no se expone en la respuesta de registro; se entrega por correo usando plantilla HTML.
- La configuracion inicial de usuario se crea al verificar la cuenta con `theme=light`, `accent=blue`, `schedule_generation={"draft_schedule_university_ids":[]}`, `selected_university_id=NULL`, `status=1`.

---

## 2. Usuario autenticado y configuracion

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/user/my-info/` | Datos del usuario autenticado (nombre, correo, rol, configuracion actual). |
| `PUT` | `/api/v1/user/configurations/` | Actualiza configuracion del usuario (`selected_university_id`, `theme`, `accent`). |

Notas de respuesta para configuracion de usuario:
- Cuando se consulta configuracion (`GET /api/v1/user/configurations/`), el backend retorna `selected_university` (id, name, short_name).
- Si la universidad seleccionada tiene `uses_period_groups = 1` y existe periodo activo (`academic_periods.is_active = 1`), se retorna tambien `selected_university_active_period_name`.
- Si no aplica o no existe periodo activo, `selected_university_active_period_name` se retorna como `null`.

---

## 3. Catalogos (solo GET)

Entidades que casi nunca cambian. Se usan principalmente en selects de formularios.

| Metodo | Endpoint | Descripcion | Donde se usa |
|--------|----------|-------------|--------------|
| `GET` | `/api/v1/roles/` | Lista todos los roles. | Gestion de usuarios |
| `GET` | `/api/v1/period-types/` | Lista tipos de periodo (semestre, cuatrimestre, trimestre). | Formulario **Nueva Universidad** -> "Tipo de Periodo" |
| `GET` | `/api/v1/colors/` | Lista colores con hex y contrast_hex. | Formulario **Nueva Materia** -> selector de color |
| `GET` | `/api/v1/classroom-types/` | Lista tipos de aula (Salon, Laboratorio, Compuaula). | Formulario **Nueva Aula** -> "Tipo de Aula" |

---

## 4. Universidades

### Consideraciones de carga en el formulario de edicion

El formulario de edicion de universidad tiene **4 pestanas**: Datos generales, Modalidades, Turnos y Periodos academicos.

- La carga es **lazy por pestana**: al abrir el formulario solo se trae el detalle general (`GET /api/v1/universities/{pk}/`).
- Cuando el usuario navega a una pestana, se dispara el GET del sub-recurso en contexto de universidad seleccionada.
- El **`POST` de creacion si es una transaccion completa** (datos + modalidades + turnos + periodos), ya que al crear se configura todo de golpe y debe ser atomico.
- El **`PUT` de actualizacion solo toca los datos generales** de la universidad. Modalidades, turnos y periodos tienen sus propios endpoints de actualizacion.

---

### 4.1 CRUD principal

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/universities/` | Lista **todas** las universidades del usuario (para selects). |
| `GET` | `/api/v1/universities/paginated/` | Lista paginada con filtros (vista de lista). |
| `POST` | `/api/v1/universities/` | **Transaccion completa:** crea universidad + modalidades + turnos + periodos academicos. |
| `GET` | `/api/v1/universities/{pk}/` | Detalle de **datos generales** unicamente (pestana "Datos generales"). |
| `GET` | `/api/v1/universities/{pk}/image/` | Retorna el logo/imagen de la universidad en binario (solo usuario autenticado con acceso a esa universidad). |
| `PUT` | `/api/v1/universities/{pk}/` | Actualiza **solo datos generales** de la universidad. |
| `PUT` | `/api/v1/universities/{pk}/toggle-status/` | Activa o desactiva la universidad. |
| `DELETE` | `/api/v1/universities/{pk}/` | Soft delete. |

**Query params paginado:**
- `search` - nombre o nombre corto
- `status` - `1` / `0`
- `page`, `per_page`

**Body POST (creacion - transaccion completa):**
```json
{
  "name": "Universidad Emiliano Zapata",
  "short_name": "UTEZ",
  "institution_code": "UTEZ001",
  "start_time": "07:00",
  "end_time": "22:00",
  "period_type_id": 1,
  "uses_period_groups": true,
  "image_url": "https://ejemplo.com/logo.png",
  "modalities": [
    {
      "name": "Presencial",
      "require_classroom": true,
      "configurations": {
        "allowed_days": [1, 2, 3, 4, 5],
        "classroom_days_per_week": 5
      }
    }
  ],
  "shifts": [
    { "name": "Matutino", "start_time": "08:00", "end_time": "14:00", "order": 1 }
  ],
  "academic_periods": [
    {
      "name": "Mayo - Agosto 2025",
      "start_month": 5,
      "end_month": 8,
      "year": 2025,
      "order": 1,
      "is_active": true
    }
  ]
}
```

> `academic_periods` solo se envia si `uses_period_groups` es `true`.

**Body PUT (actualizacion - solo datos generales):**
```json
{
  "name": "Universidad Emiliano Zapata",
  "short_name": "UTEZ",
  "institution_code": "UTEZ001",
  "start_time": "07:00",
  "end_time": "22:00",
  "period_type_id": 1,
  "uses_period_groups": true,
  "image_url": "https://ejemplo.com/logo.png"
}
```

---

### 4.2 Modalidades

Se gestionan de forma independiente. Se cargan cuando el usuario navega a la pestana **Modalidades**.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/modalities/` | Lista **todas** las modalidades de la universidad seleccionada. Tambien usado en select de **Nueva Carrera** -> "Modalidad". |
| `POST` | `/api/v1/university/modalities/` | Crea una nueva modalidad. |
| `PUT` | `/api/v1/university/modalities/{modality_pk}/` | Actualiza una modalidad. |
| `DELETE` | `/api/v1/university/modalities/{modality_pk}/` | Elimina una modalidad. |

**Body (POST / PUT):**
```json
{
  "name": "Mixta",
  "require_classroom": true,
  "configurations": {
    "allowed_days": [1, 3, 5],
    "classroom_days_per_week": 3
  }
}
```

---

### 4.3 Turnos

Se gestionan de forma independiente. Se cargan cuando el usuario navega a la pestana **Turnos**.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/shifts/` | Lista **todos** los turnos de la universidad seleccionada. Tambien usado en select de **Nuevo Grupo** -> "Turno". |
| `POST` | `/api/v1/university/shifts/` | Crea un nuevo turno. |
| `PUT` | `/api/v1/university/shifts/{shift_pk}/` | Actualiza un turno. |
| `DELETE` | `/api/v1/university/shifts/{shift_pk}/` | Elimina un turno. |

**Body (POST / PUT):**
```json
{
  "name": "Matutino",
  "start_time": "08:00",
  "end_time": "14:00",
  "order": 1
}
```

> Las horas deben estar dentro del rango `start_time`-`end_time` de la universidad (validacion backend).

---

### 4.4 Periodos Academicos

Se gestionan de forma independiente. Se cargan cuando el usuario navega a la pestana **Periodos academicos**. Solo aplica cuando `uses_period_groups = true`.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/academic-periods/` | Lista **todos** los periodos. Tambien usado en select de **Nuevo Grupo** -> "Periodo academico". |
| `POST` | `/api/v1/university/academic-periods/` | Crea un nuevo periodo academico. |
| `PUT` | `/api/v1/university/academic-periods/{period_pk}/` | Actualiza un periodo. |
| `PUT` | `/api/v1/university/academic-periods/{period_pk}/toggle-status/` | Activa el periodo (desactiva los demas; solo uno puede estar activo a la vez). |
| `DELETE` | `/api/v1/university/academic-periods/{period_pk}/` | Elimina un periodo. |

**Body (POST / PUT):**
```json
{
  "name": "Mayo - Agosto 2025",
  "start_month": 5,
  "end_month": 8,
  "year": 2025,
  "order": 1
}
```

---

### 4.5 Prioridades de tipo de aula por universidad

Permite configurar el orden de preferencia de tipos de aula para la **universidad seleccionada**.

Estas prioridades solo aplican cuando la materia **no** esta restringida por `subjects_classroom_types`.

Si una universidad no tiene configuraciones en esta tabla, el generador usa fallback hardcodeado: para materias no restringidas por tipo intenta primero `Aula` y luego evalua el resto de reglas duras.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/classroom-type-priorities/` | Lista prioridades activas de la universidad seleccionada. |
| `POST` | `/api/v1/university/classroom-type-priorities/` | Crea una configuracion de prioridad por tipo de aula. |
| `GET` | `/api/v1/university/classroom-type-priorities/{pk}/` | Detalle de una configuracion. |
| `PUT` | `/api/v1/university/classroom-type-priorities/{pk}/` | Actualiza prioridad y/o tipo de aula de una configuracion. |
| `DELETE` | `/api/v1/university/classroom-type-priorities/{pk}/` | Soft delete de la configuracion. |

**Body (POST / PUT):**
```json
{
  "classroom_type_id": 1,
  "priority": 10
}
```

Reglas:

- `priority` debe ser >= 1.
- Solo acepta `classroom_type_id` activos y no eliminados.
- Debe existir a lo mas una configuracion activa por combinacion `universidad + tipo_de_aula`.
- `DELETE` realiza borrado logico (`is_deleted = 1`).

---

## 5. Carreras

La creacion incluye las excepciones de periodos en la misma transaccion.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/careers/` | Lista **todas** las carreras sin paginar. Usado en selects de: **Nueva Materia** -> "Carreras a las que pertenece", **Nuevo Grupo** -> "Carrera", **Nueva Aula** -> "Carreras con acceso". |
| `GET` | `/api/v1/university/careers/paginated/` | Lista paginada con filtros (vista de lista de Carreras). |
| `POST` | `/api/v1/university/careers/` | **Transaccion completa:** crea carrera + excepciones de periodo. |
| `GET` | `/api/v1/university/careers/{pk}/` | Detalle de la carrera (incluye excepciones). |
| `PUT` | `/api/v1/university/careers/{pk}/` | Actualiza carrera + excepciones (reemplaza el listado completo de excepciones). |
| `PUT` | `/api/v1/university/careers/{pk}/toggle-status/` | Activa o desactiva la carrera. |
| `DELETE` | `/api/v1/university/careers/{pk}/` | Soft delete. |

**Query params paginado:**
- `search` - nombre o nombre corto
- `status` - `1` / `0`
- `modality_id` - filtrar por modalidad
- `order` - `asc` / `desc`
- `page`, `per_page`

**Body (POST / PUT):**
```json
{
  "name": "Desarrollo de Software",
  "short_name": "DSM",
  "code": "DSM-01",
  "modality_id": 1,
  "total_periods": 12,
  "period_exceptions": [
    { "period_number": 6, "reason": "Periodo de estadias" },
    { "period_number": 8, "reason": "Periodo de estadias" }
  ]
}
```

> Las excepciones de periodo se gestionan siempre junto con la carrera (no tienen endpoints propios), ya que en la pantalla aparecen dentro del mismo formulario.

---

## 6. Materias

La creacion incluye la asignacion a carrera(s) con numero de periodo, la asignacion de profesores y (cuando aplica) la asignacion de tipos de aula permitidos, en una sola transaccion.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/subjects/` | Lista **todas** las materias sin paginar. Usado en select de **Nuevo Profesor** -> "Materias que puede impartir". |
| `GET` | `/api/v1/university/subjects/paginated/` | Lista paginada con filtros (vista de lista de Materias). |
| `POST` | `/api/v1/university/subjects/` | **Transaccion completa:** crea materia + relacion con carreras (con numero de periodo) + profesores asignados + tipos de aula permitidos (si aplica). |
| `GET` | `/api/v1/university/subjects/{pk}/` | Detalle de la materia (incluye carreras, profesores y tipos de aula permitidos). |
| `PUT` | `/api/v1/university/subjects/{pk}/` | Actualiza materia + carreras + profesores + tipos de aula (sincroniza listas recibidas y conserva las no enviadas). |
| `PUT` | `/api/v1/university/subjects/{pk}/toggle-status/` | Activa o desactiva la materia. |
| `DELETE` | `/api/v1/university/subjects/{pk}/` | Soft delete. |

**Query params paginado:**
- `search` - nombre o nombre corto
- `status` - `1` / `0`
- `order` - `asc` / `desc`
- `page`, `per_page`

**Body (POST / PUT):**
```json
{
  "name": "Base de Datos",
  "short_name": "ABD",
  "code": "ABD-01",
  "description": "Descripcion opcional",
  "hours_per_week": 4,
  "color_id": 1,
  "is_restricted_to_classroom_types": true,
  "is_mandatory": true,
  "careers": [
    { "career_id": 1, "period_number": 3 }
  ],
  "teachers": [
    { "teacher_id": 5 }
  ],
  "classroom_types": [
    { "classroom_type_id": 2 }
  ]
}
```

> Si `is_restricted_to_classroom_types = true`, se debe enviar al menos un elemento en `classroom_types`.

> Si `is_restricted_to_classroom_types = false`, `classroom_types` puede omitirse o enviarse vacio (en update, esto limpia las relaciones activas).

> Si `classroom_types` llega con elementos, el backend marca automaticamente `is_restricted_to_classroom_types = true`.

> Si `classroom_types` llega vacio en el payload, el backend marca `is_restricted_to_classroom_types = false` y limpia relaciones activas.

> Selects que alimentan este formulario:
> - `GET /api/v1/university/careers/` -> "Carreras a las que pertenece"
> - `GET /api/v1/university/teachers/` -> "Profesores que pueden impartir"
> - `GET /api/v1/classroom-types/` -> "Tipos de aula permitidos" (cuando aplica)
> - `GET /api/v1/colors/` -> selector visual de color

---

## 7. Grupos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/groups/` | Lista **todos** los grupos sin paginar (para selects si se requiere). |
| `GET` | `/api/v1/university/groups/paginated/` | Lista paginada con filtros (vista de lista de Grupos). |
| `POST` | `/api/v1/university/groups/` | Crea un nuevo grupo. |
| `GET` | `/api/v1/university/groups/{pk}/` | Detalle de un grupo. |
| `PUT` | `/api/v1/university/groups/{pk}/` | Actualiza un grupo. |
| `PUT` | `/api/v1/university/groups/{pk}/toggle-status/` | Activa o desactiva el grupo. |
| `DELETE` | `/api/v1/university/groups/{pk}/` | Soft delete. |

**Query params paginado:**
- `search` - nombre del grupo
- `career_id` - filtrar por carrera
- `status` - `1` / `0`
- `order` - `asc` / `desc`
- `page`, `per_page`

**Body (POST / PUT):**
```json
{
  "name": "3D",
  "career_id": 1,
  "period_number": 3,
  "letter": "D",
  "shift_id": 1,
  "academic_period_id": null
}
```

> `academic_period_id` solo aplica si `uses_period_groups = true` en la universidad seleccionada.

> Selects que alimentan este formulario:
> - `GET /api/v1/university/careers/` -> "Carrera"
> - `GET /api/v1/university/shifts/` -> "Turno"
> - `GET /api/v1/university/academic-periods/` -> "Periodo academico" (si aplica)

---

## 8. Profesores

La creacion incluye intervalos de disponibilidad horaria y materias que puede impartir, en una sola transaccion.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/teachers/` | Lista **todos** los profesores sin paginar. Usado en select de **Nueva Materia** -> "Profesores que pueden impartir". |
| `GET` | `/api/v1/university/teachers/paginated/` | Lista paginada con filtros (vista de lista de Profesores). |
| `POST` | `/api/v1/university/teachers/` | **Transaccion completa:** crea profesor + disponibilidades + materias asignadas. |
| `GET` | `/api/v1/university/teachers/{pk}/` | Detalle del profesor (incluye disponibilidades y materias). |
| `PUT` | `/api/v1/university/teachers/{pk}/` | Actualiza profesor + disponibilidades + materias (reemplaza las listas completas). |
| `PUT` | `/api/v1/university/teachers/{pk}/toggle-status/` | Activa o desactiva el profesor. |
| `DELETE` | `/api/v1/university/teachers/{pk}/` | Soft delete. |

**Query params paginado:**
- `search` - nombre del profesor
- `status` - `1` / `0`
- `order` - `asc` / `desc`
- `page`, `per_page`

**Body (POST / PUT):**
```json
{
  "name": "Alejandro",
  "surname": "Martinez",
  "last_name": "Gomez",
  "require_classroom": true,
  "availabilities": [
    { "day_of_week": 1, "start_time": "07:00", "end_time": "08:00", "is_available": true },
    { "day_of_week": 1, "start_time": "08:00", "end_time": "09:00", "is_available": false },
    { "day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "is_available": true }
  ],
  "subjects": [
    { "subject_id": 3 }
  ]
}
```

> Select que alimenta este formulario:
> - `GET /api/v1/university/subjects/` -> "Materias que puede impartir"

---

## 9. Aulas

La creacion incluye la asignacion de carreras cuando `is_restricted = true` y la asignacion de materias cuando `is_restricted_to_subjects = true`, en la misma transaccion.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/v1/university/classrooms/` | Lista **todas** las aulas sin paginar (para selects si se requiere). |
| `GET` | `/api/v1/university/classrooms/paginated/` | Lista paginada con filtros (vista de lista de Aulas). |
| `GET` | `/api/v1/university/classrooms/subject-periods/` | Catalogo de periodos con materias para una carrera (`career_id`). Se usa para el flujo de materias restringidas en el formulario de Aulas. |
| `GET` | `/api/v1/university/classrooms/subject-options/` | Catalogo de materias por `career_id` + `period_number` para el flujo de materias restringidas en Aulas. |
| `POST` | `/api/v1/university/classrooms/` | **Transaccion completa:** crea aula + carreras con acceso (si `is_restricted = 1`) + materias permitidas (si `is_restricted_to_subjects = 1`). |
| `GET` | `/api/v1/university/classrooms/{pk}/` | Detalle del aula (incluye carreras y materias segun sus banderas de restriccion). |
| `PUT` | `/api/v1/university/classrooms/{pk}/` | Actualiza aula + carreras + materias (sincroniza listas recibidas y conserva las no enviadas). |
| `PUT` | `/api/v1/university/classrooms/{pk}/toggle-status/` | Activa o desactiva el aula. |
| `DELETE` | `/api/v1/university/classrooms/{pk}/` | Soft delete. |

**Query params paginado:**
- `search` - nombre del aula o edificio
- `classroom_type_id` - filtrar por tipo de aula
- `status` - `1` / `0`
- `order` - `asc` / `desc`
- `page`, `per_page`

**Body (POST / PUT):**
```json
{
  "name": "A2",
  "classroom_type_id": 2,
  "code": "A3",
  "floor": 1,
  "building": "Docencia 4",
  "building_code": "D2",
  "is_restricted": true,
  "is_restricted_to_subjects": true,
  "careers": [
    { "career_id": 1 }
  ],
  "subjects": [
    { "subject_id": 3 }
  ]
}
```

> Si `is_restricted = false`, el campo `careers` se omite o se envia vacio.

> Si `is_restricted_to_subjects = false`, el campo `subjects` se omite o se envia vacio.

> Al activar `is_restricted = true` o `is_restricted_to_subjects = true` por primera vez, se debe enviar su lista correspondiente y con al menos un elemento.

> Cuando `is_restricted = true` **e** `is_restricted_to_subjects = true`, las materias enviadas en `subjects` deben pertenecer al menos a una de las carreras permitidas del aula.

> Flujo recomendado del frontend para materias restringidas: **carrera -> periodo -> materia**. Cada materia se agrega una por una y se pueden mezclar materias de diferentes carreras.

> Selects que alimentan este formulario:
> - `GET /api/v1/classroom-types/` -> "Tipo de Aula"
> - `GET /api/v1/university/careers/` -> "Carreras con acceso" (cuando es restringida)
> - `GET /api/v1/university/classrooms/subject-periods/?career_id={id}` -> "Periodos" segun la carrera elegida (cuando `is_restricted_to_subjects = 1`)
> - `GET /api/v1/university/classrooms/subject-options/?career_id={id}&period_number={n}` -> "Materias" segun carrera+periodo (cuando `is_restricted_to_subjects = 1`)

---

## 10. Generacion y Versionamiento de Horario

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `POST` | `/api/v1/university/schedules/generate/` | Genera horario y crea/actualiza el borrador activo de la universidad seleccionada (conserva label en regeneracion). |
| `PUT` | `/api/v1/university/schedules/drafts/{pk}/` | Actualiza campos de un borrador no confirmado (incluye label cuando se requiere cambio junto con otros campos). |
| `DELETE` | `/api/v1/university/schedules/drafts/{pk}/` | Elimina logicamente un borrador no confirmado. |
| `PUT` | `/api/v1/university/schedules/{pk}/confirm/` | Confirma una version de horario. |
| `PUT` | `/api/v1/university/schedules/{pk}/label/` | Ruta dedicada para actualizar exclusivamente el label de la version. |
| `GET` | `/api/v1/university/schedules/paginated/` | Lista paginada del historial de versiones por universidad seleccionada. |
| `GET` | `/api/v1/university/schedules/{pk}/` | Detalle de una version de horario. |
| `POST` | `/api/schedule-generator/preview/` | Genera preview en memoria sin persistir version. |

Notas de comportamiento en `POST /api/v1/university/schedules/generate/`:

**Body opcional de generacion:**
```json
{
  "parameters": {
    "allow_multiple_teachers_per_group_subject": false,
    "randomize_generation": false,
    "random_seed": null
  }
}
```

- En la primera generacion, el backend asigna label por defecto con formato `Borrador YYYY-MM-DD HH:MM`.
- En regeneracion de borrador existente, el endpoint conserva el label actual.
- `parameters.uses_period_groups` siempre se define desde backend segun la configuracion institucional.
- `parameters.allow_multiple_teachers_per_group_subject` controla si una materia de un grupo puede ser impartida por varios profesores dentro del mismo horario generado.
- Si no se envia `allow_multiple_teachers_per_group_subject`, el backend usa `false` por defecto (un solo profesor por combinacion `grupo + materia`).
- Si `allow_multiple_teachers_per_group_subject = true`, el solver puede asignar distintos profesores para bloques diferentes de la misma materia en el mismo grupo.
- `parameters.randomize_generation` controla si el solver usa desempates aleatorios.
- Si no se envia `randomize_generation`, el backend usa `false` por defecto (comportamiento determinista actual).
- Si `randomize_generation = true` y no se envia `random_seed`, el backend genera una semilla automaticamente y la persiste en `schedule_versions.parameters.random_seed`.
- Si `randomize_generation = true` y se envia `random_seed`, se puede reproducir el mismo resultado con la misma semilla (manteniendo datos y logica sin cambios).
- `data.active_academic_period` guarda el periodo activo institucional (si existe).
- Cada elemento de `data.groups[]` incluye metadata enriquecida: `career`, `shift`, `academic_period`, `allowed_days`.
- Para representar correctamente la rejilla en frontend, usar `data.groups[].shift.start_time/end_time` como ventana del turno y completar slots vacios del intervalo aunque no vengan bloques asignados para todos.

---

## Resumen: selects y sus endpoints

| Formulario | Campo select | Endpoint |
|------------|-------------|----------|
| Nueva Universidad | Tipo de Periodo | `GET /api/v1/period-types/` |
| Nueva Carrera | Modalidad | `GET /api/v1/university/modalities/` |
| Nueva Materia | Carreras a las que pertenece | `GET /api/v1/university/careers/` |
| Nueva Materia | Profesores que pueden impartir | `GET /api/v1/university/teachers/` |
| Nueva Materia | Tipos de aula permitidos | `GET /api/v1/classroom-types/` |
| Nueva Materia | Color de la Materia | `GET /api/v1/colors/` |
| Nuevo Grupo | Carrera | `GET /api/v1/university/careers/` |
| Nuevo Grupo | Turno | `GET /api/v1/university/shifts/` |
| Nuevo Grupo | Periodo academico | `GET /api/v1/university/academic-periods/` |
| Nuevo Profesor | Materias que puede impartir | `GET /api/v1/university/subjects/` |
| Nueva Aula | Tipo de Aula | `GET /api/v1/classroom-types/` |
| Nueva Aula | Carreras con acceso | `GET /api/v1/university/careers/` |
| Nueva Aula | Carrera para filtrar materias | `GET /api/v1/university/careers/` |
| Nueva Aula | Periodo para filtrar materias | `GET /api/v1/university/classrooms/subject-periods/?career_id={id}` |
| Nueva Aula | Materias permitidas (filtradas) | `GET /api/v1/university/classrooms/subject-options/?career_id={id}&period_number={n}` |

---

## Resumen: estrategia de carga en formularios de edicion

| Recurso | Estrategia GET | Estrategia PUT |
|---------|----------------|----------------|
| Universidad | **Lazy por pestana:** datos generales al abrir; modalidades, turnos y periodos solo al navegar a cada pestana | Solo actualiza datos generales de la universidad |
| Universidad -> Modalidades | `GET /api/v1/university/modalities/` al entrar a la pestana | `PUT /api/v1/university/modalities/{modality_pk}/` por modalidad individual |
| Universidad -> Turnos | `GET /api/v1/university/shifts/` al entrar a la pestana | `PUT /api/v1/university/shifts/{shift_pk}/` por turno individual |
| Universidad -> Periodos | `GET /api/v1/university/academic-periods/` al entrar a la pestana | `PUT /api/v1/university/academic-periods/{period_pk}/` por periodo individual |
| Universidad -> Prioridades de tipo de aula | `GET /api/v1/university/classroom-type-priorities/` para ver configuracion institucional | `PUT /api/v1/university/classroom-type-priorities/{pk}/` para ajustar prioridad/tipo; `DELETE` hace borrado logico |
| Carrera | Un solo GET trae todo (datos + excepciones, formulario simple) | PUT reemplaza excepciones completas junto con los datos (comparando cambios para evitar escrituras innecesarias) |
| Materia | Un solo GET trae todo (datos + carreras + profesores + tipos de aula permitidos) | PUT sincroniza carreras/profesores/tipos de aula: reemplaza la lista solo cuando se envia; conserva la que no se envia |
| Profesor | Un solo GET trae todo (datos + disponibilidades + materias) | PUT reemplaza listas completas (comparando cambios para evitar escrituras innecesarias) |
| Aula | Un solo GET trae todo (datos + carreras + materias segun restricciones) | PUT sincroniza carreras/materias: reemplaza la lista solo cuando se envia; conserva la que no se envia |

---

## Resumen: transacciones compuestas (solo en POST)

| Recurso | El `POST` incluye en la misma transaccion |
|---------|------------------------------------------|
| Universidad | Datos generales + modalidades + turnos + periodos academicos |
| Carrera | Datos de la carrera + excepciones de periodo |
| Materia | Datos de la materia + carreras con numero de periodo + profesores + tipos de aula permitidos (si aplica) |
| Profesor | Datos del profesor + intervalos de disponibilidad + materias |
| Aula | Datos del aula + carreras con acceso (si `is_restricted = 1`) + materias permitidas (si `is_restricted_to_subjects = 1`) |
