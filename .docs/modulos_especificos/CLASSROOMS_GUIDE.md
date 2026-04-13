# Guia rapida: `classrooms` (Aulas) y restricciones por carrera/materia

> **Rutas y listado completo de endpoints:** ver **`BACKEND_ENDPOINTS_POR_REALIZAR.md`**.

- **`Classrooms`**: aula fisica (salon, laboratorio, compuaula).
- **`ClassroomCareers`**: carreras que pueden usar el aula cuando esta restringida por carrera.
- **`ClassroomSubjects`**: materias que pueden usar el aula cuando esta restringida por materia.
- **`CareerSubjects`**: plan de estudios (carrera + periodo + materia), usado como catalogo para filtrar materias por carrera y periodo.

---

## 1) Modelos y relacion funcional

### `Classrooms` (tabla `classrooms`)
Define el aula y sus banderas de restriccion.

Campos clave:
- `name`, `classroom_type`, `code`, `floor`, `building`, `building_code`
- `is_restricted`: 1/0 (restringida por carrera)
- `is_restricted_to_subjects`: 1/0 (restringida por materia)
- `status`, `is_deleted`

Modelo:
- `horarios_backend/classrooms/models/classrooms.py`

### `ClassroomCareers` (tabla `classroom_careers`)
Relacion many-to-many entre aula y carrera (con soft delete).

Modelo:
- `horarios_backend/classrooms/models/classroom_careers.py`

### `ClassroomSubjects` (tabla `classroom_subjects`)
Relacion many-to-many entre aula y materia (con soft delete).

Modelo:
- `horarios_backend/classrooms/models/classroom_subjects.py`

### `CareerSubjects` (tabla `career_subjects`)
Relaciona carrera + periodo + materia. Se usa para:
- listar periodos disponibles por carrera,
- listar materias por carrera y periodo,
- validar que materias restringidas pertenezcan a las carreras permitidas del aula.

Modelo:
- `horarios_backend/careers/models/career_subjects.py`

---

## 2) Reglas de negocio

1. Si `is_restricted = 1`, debe existir al menos una carrera permitida.
2. Si `is_restricted_to_subjects = 1`, debe existir al menos una materia permitida.
3. Si ambas banderas estan activas (`is_restricted = 1` e `is_restricted_to_subjects = 1`):
- cada materia enviada en `subjects` debe pertenecer al menos a una carrera permitida del aula.
4. Si una bandera se desactiva en `PUT`, el backend limpia automaticamente sus relaciones:
- `is_restricted = 0` -> limpia `classroom_careers` activas,
- `is_restricted_to_subjects = 0` -> limpia `classroom_subjects` activas.

Validacion principal:
- `horarios_backend/classrooms/serializers/classrooms/classroom_write_serializer.py`

---

## 3) Endpoints del modulo

Rutas:
- `horarios_backend/classrooms/urls/classrooms.py`

### CRUD principal de aulas
- `GET /api/v1/university/classrooms/`
- `GET /api/v1/university/classrooms/paginated/`
- `POST /api/v1/university/classrooms/`
- `GET /api/v1/university/classrooms/{pk}/`
- `PUT /api/v1/university/classrooms/{pk}/`
- `PUT /api/v1/university/classrooms/{pk}/toggle-status/`
- `DELETE /api/v1/university/classrooms/{pk}/`

### Intercepcion aula-carrera (edicion incremental)
- `GET /api/v1/university/classroom-careers/?classroom_id={id}`
- `POST /api/v1/university/classroom-careers/`
- `DELETE /api/v1/university/classroom-careers/{pk}/`

### Catalogos para materias restringidas (nuevo flujo)
- `GET /api/v1/university/classrooms/subject-periods/?career_id={id}`
- Retorna periodos donde la carrera tiene materias activas.

- `GET /api/v1/university/classrooms/subject-options/?career_id={id}&period_number={n}`
- Retorna materias activas de esa carrera en ese periodo.

---

## 4) Flujo recomendado de formulario (frontend)

En `ClassroomForm`:

1. Configurar datos generales del aula.
2. Si se activa "Restringida a carreras especificas":
- agregar carreras con acceso.
3. Si se activa "Restringida a materias especificas":
- seleccionar **carrera**,
- seleccionar **periodo**,
- seleccionar **materia**,
- agregar materia,
- repetir para mezclar materias de distintas carreras.

Comportamiento esperado:
- si el aula esta restringida por carrera, el selector de carrera para materias usa solo carreras permitidas del aula,
- en edicion, el formulario carga materias ya guardadas y permite agregar/quitar antes de guardar,
- en detalle, se muestra bandera de restriccion por materia y la lista de materias permitidas.

Archivos frontend clave:
- `horarios_frontend/src/modules/user/features/classrooms/components/ClassroomForm.jsx`
- `horarios_frontend/src/modules/user/features/classrooms/components/ClassroomDetail.jsx`
- `horarios_frontend/src/modules/user/features/classrooms/hooks/useClassrooms.js`
- `horarios_frontend/src/modules/user/features/classrooms/api/classroomsApi.js`
- `horarios_frontend/src/shared/components/inputs/CascadingSelectableListField.jsx` (componente reusable del flujo encadenado)

---

## 5) Ejemplos de request

### Crear aula restringida por carrera y materia

```json
{
  "name": "A2",
  "classroom_type": 2,
  "code": "A2-01",
  "floor": 1,
  "building": "Docencia 4",
  "building_code": "D2",
  "is_restricted": 1,
  "is_restricted_to_subjects": 1,
  "careers": [1, 4],
  "subjects": [3, 15, 19]
}
```

### Actualizar aula y limpiar restriccion por materias

```json
{
  "is_restricted_to_subjects": 0
}
```

Resultado:
- el backend limpia relaciones activas en `classroom_subjects` para ese aula.

---

## 6) Archivos backend clave

- Vistas:
- `horarios_backend/classrooms/views/classrooms.py`
- `horarios_backend/classrooms/views/classroom_careers.py`

- Serializers:
- `horarios_backend/classrooms/serializers/classrooms/classroom_write_serializer.py`
- `horarios_backend/classrooms/serializers/classrooms/classroom_detail_serializer.py`

- Rutas:
- `horarios_backend/classrooms/urls/classrooms.py`

---

## 7) Nota operativa

El frontend envia `subjects` como lista de IDs de materia. El backend valida universidad, restricciones activas y coherencia con carreras permitidas (cuando ambas restricciones estan activas). Esto mantiene integridad del modulo sin duplicar logica de negocio en cliente.