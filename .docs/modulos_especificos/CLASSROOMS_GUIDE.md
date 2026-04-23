# BACKEND - Modulo Classrooms (Aulas y Restricciones)

## 1) Proposito de este documento

Documentar el funcionamiento completo de `classrooms`:

- alta/edicion de aulas,
- restricciones por carrera y por materia,
- endpoints de catalogo para flujo encadenado de materias,
- y reglas de integridad que impactan la generacion de horarios.

## 2) Alcance

Incluye:

- entidad principal `Classrooms`,
- relacion `ClassroomCareers`,
- catalogos por carrera/periodo (`subject-periods`, `subject-options`),
- comportamiento CRUD, paginado y toggle-status.

No incluye:

- logica de render de UI,
- algoritmo de asignacion de horarios.

## 3) Flujo funcional rapido

1. Usuario crea aula con datos base (tipo, codigo, edificio, etc.).
2. Opcionalmente activa restricciones:
- por carreras permitidas,
- por materias permitidas.
3. Si activa restriccion por materias, usa catalogos por carrera/periodo para seleccionar materias validas.
4. Backend valida consistencia y persiste cambios.

## 4) Ubicacion del modulo

Archivos clave:

- `horarios_backend/classrooms/models/classrooms.py`
- `horarios_backend/classrooms/models/classroom_careers.py`
- `horarios_backend/classrooms/models/classroom_subjects.py`
- `horarios_backend/classrooms/views/classrooms.py`
- `horarios_backend/classrooms/views/classroom_careers.py`
- `horarios_backend/classrooms/serializers/classrooms/classroom_write_serializer.py`
- `horarios_backend/classrooms/serializers/classrooms/classroom_detail_serializer.py`
- `horarios_backend/classrooms/urls/classrooms.py`
- `horarios_backend/classrooms/urls/classroom_careers.py`

## 5) Seguridad y contexto

Todos los endpoints funcionales usan:

- `IsAuthenticated`
- `RequireSelectedUniversity`

Consecuencia:

- cualquier lectura/escritura queda acotada a la universidad seleccionada del usuario.

## 6) Endpoints del modulo

### 6.1 CRUD principal de aulas

- `GET /api/v1/university/classrooms/`
- `POST /api/v1/university/classrooms/`
- `GET /api/v1/university/classrooms/paginated/`
- `GET /api/v1/university/classrooms/{id}/`
- `PUT /api/v1/university/classrooms/{id}/`
- `DELETE /api/v1/university/classrooms/{id}/`
- `PUT /api/v1/university/classrooms/{id}/toggle-status/`

### 6.2 Catalogos para restriccion por materias

- `GET /api/v1/university/classrooms/subject-periods/?career_id={id}`
- `GET /api/v1/university/classrooms/subject-options/?career_id={id}&period_number={n}`

### 6.3 Relacion incremental aula-carrera

- `GET /api/v1/university/classroom-careers/`
- `POST /api/v1/university/classroom-careers/`
- `GET /api/v1/university/classroom-careers/{id}/`
- `PUT /api/v1/university/classroom-careers/{id}/`
- `DELETE /api/v1/university/classroom-careers/{id}/`

## 7) Modelo de datos y banderas importantes

### 7.1 Classrooms

Campos destacados:

- `name`, `code`
- `classroom_type`
- `floor`, `building`, `building_code`
- `is_restricted`
- `is_restricted_to_subjects`
- `status`
- `is_deleted`

### 7.2 ClassroomCareers

Relacion de aulas con carreras permitidas cuando se activa restriccion por carrera.

### 7.3 ClassroomSubjects

Relacion de aulas con materias permitidas cuando se activa restriccion por materia.

## 8) Lectura y paginacion

### 8.1 Lista simple

`ClassroomListView.get`:

- devuelve aulas activas (`status=1`) no eliminadas (`is_deleted=0`),
- ordenadas por `name`, `id`.

### 8.2 Lista paginada

`ClassroomPaginatedView.get` soporta:

- `page`, `limit`
- `search` (`name`, `code`, `building`, `building_code`)
- `status`
- `classroom_type_id`
- `sortBy`, `order`

## 9) Catalogos encadenados para materias

### 9.1 Subject periods

`ClassroomSubjectPeriodsView.get`:

- requiere `career_id`,
- valida que la carrera pertenezca a la universidad seleccionada,
- devuelve periodos donde esa carrera tiene materias activas.

### 9.2 Subject options

`ClassroomSubjectOptionsView.get`:

- requiere `career_id` y `period_number`,
- valida tipo y rango de parametros,
- valida pertenencia de carrera a universidad,
- devuelve materias activas para esa carrera y periodo.

## 10) Escritura (POST/PUT/DELETE/toggle)

### 10.1 Crear aula

`ClassroomListView.post` + `ClassroomWriteSerializer`:

- valida datos principales,
- aplica reglas de restricciones,
- persiste en transaccion.

### 10.2 Actualizar aula

`ClassroomDetailView.put`:

- update parcial,
- mantiene alcance por universidad seleccionada,
- devuelve detalle completo actualizado.

### 10.3 Soft delete

`ClassroomDetailView.delete`:

- marca `is_deleted=1`.

### 10.4 Toggle status

`ClassroomToggleStatusView.put`:

- alterna `status` activo/inactivo,
- registra accion de auditoria `CHANGE_STATUS`.

## 11) Reglas de negocio clave

1. Si un aula esta restringida por carrera (`is_restricted=1`), debe tener carreras permitidas coherentes.
2. Si esta restringida por materia (`is_restricted_to_subjects=1`), la seleccion de materias debe venir del catalogo valido por carrera/periodo.
3. Las consultas ignoran eliminados logicos.
4. Toda operacion usa la universidad seleccionada como frontera de datos.

## 12) Errores frecuentes

1. `400 career_id invalido` en catalogos:
- parametro no numerico o vacio.

2. `400 period_number invalido`:
- parametro no numerico o menor/igual a cero.

3. Catalogos vacios:
- carrera sin materias activas en el periodo,
- o datos de carrera/materia fuera de la universidad seleccionada.

4. `404` en update/delete:
- aula inexistente,
- aula eliminada logicamente,
- o aula fuera de la universidad seleccionada.

## 13) Integracion con otros modulos

- `careers`: provee carrera y plan de materias (`career_subjects`) para filtros.
- `subjects`: fuente de materias activas.
- `schedule_generator`: consume aulas activas/restringidas para asignaciones fisicas.

## 14) Ejemplo de payload de alta

```json
{
  "name": "Laboratorio A2",
  "classroom_type": 2,
  "code": "LAB-A2",
  "floor": 1,
  "building": "Edificio A",
  "building_code": "EA",
  "is_restricted": 1,
  "is_restricted_to_subjects": 1,
  "careers": [1, 4],
  "subjects": [3, 15, 19]
}
```

## 15) Checklist de QA

- [ ] Crear aula simple sin restricciones.
- [ ] Crear aula con restricciones por carrera.
- [ ] Crear aula con restricciones por materia.
- [ ] Probar `subject-periods` con carrera valida e invalida.
- [ ] Probar `subject-options` con periodo valido e invalido.
- [ ] Verificar paginado con filtros y ordenamiento.
- [ ] Verificar soft delete y toggle-status con auditoria.

## 16) Resumen ejecutivo

`classrooms` controla la disponibilidad fisica del horario y su contexto academico.

La combinacion de restricciones por carrera/materia y catalogos encadenados evita configuraciones inconsistentes y mejora la calidad de datos antes de generar horarios.
