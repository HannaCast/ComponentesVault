# BACKEND - Modulo Groups (Grupos)

## 1) Proposito de este documento

Documentar de forma completa como opera el modulo `groups`:

- reglas de negocio por periodo,
- filtros por universidad seleccionada,
- comportamiento de lectura/escritura,
- y dependencias con universidades, carreras y turnos.

## 2) Alcance

Cubre:

- modelo `Groups`,
- vistas y serializers del modulo,
- endpoints de lista, paginado, detalle, edicion, soft delete y toggle-status,
- politica de periodos con `uses_period_groups`.

No cubre:

- reglas del generador de horarios en detalle (documentado aparte),
- UX del frontend.

## 3) Flujo funcional rapido

1. Usuario selecciona universidad.
2. Crea grupos asociados a carrera y turno.
3. Si la universidad segmenta por periodos (`uses_period_groups=1`), los grupos quedan amarrados al periodo activo.
4. Listados y operaciones por id respetan ese mismo alcance de periodo activo.

## 4) Ubicacion del modulo

Archivos clave:

- `horarios_backend/careers/models/groups.py`
- `horarios_backend/careers/views/groups.py`
- `horarios_backend/careers/serializers/groups/group_write_serializer.py`
- `horarios_backend/careers/serializers/groups/group_detail_serializer.py`
- `horarios_backend/careers/serializers/groups/group_list_serializer.py`
- `horarios_backend/careers/urls/groups.py`

## 5) Seguridad y contexto

Todos los endpoints de grupos usan:

- `IsAuthenticated`
- `RequireSelectedUniversity`

Consecuencia:

- todas las consultas se limitan a la universidad seleccionada,
- evita cruces de datos entre instituciones.

## 6) Endpoints del modulo

- `GET /api/v1/university/groups/`
- `POST /api/v1/university/groups/`
- `GET /api/v1/university/groups/paginated/`
- `GET /api/v1/university/groups/{id}/`
- `PUT /api/v1/university/groups/{id}/`
- `DELETE /api/v1/university/groups/{id}/`
- `PUT /api/v1/university/groups/{id}/toggle-status/`

## 7) Regla central: uses_period_groups

Funcion utilitaria:

- `_apply_active_period_scope_if_needed(queryset, university_id)` en `views/groups.py`

Comportamiento:

1. Si `uses_period_groups != 1`:
- no restringe por periodo activo,
- opera sobre todos los grupos de la universidad (respetando `is_deleted`).

2. Si `uses_period_groups == 1`:
- restringe querysets al periodo academico activo,
- requiere `academic_period` activo y no eliminado asociado a la misma universidad.

## 8) Lectura de datos (GET)

### 8.1 Lista simple

`GroupListView.get`:

- devuelve solo grupos activos (`status=1`) y no eliminados (`is_deleted=0`),
- aplica alcance por periodo activo cuando corresponde,
- ordena por carrera, periodo, letra e id.

### 8.2 Lista paginada

`GroupPaginatedView.get`:

- parte de grupos no eliminados de la universidad,
- aplica alcance por periodo activo cuando corresponde,
- filtros: `status`, `career_id`, `search`,
- ordenamiento configurable por `sortBy`/`order`.

### 8.3 Detalle por id

`GroupDetailView.get`:

- busca por id, universidad y `is_deleted=0`,
- aplica tambien el filtro de periodo activo cuando la universidad asi lo requiere.

## 9) Escritura de datos (POST/PUT)

### 9.1 Crear grupo

`GroupListView.post` + `GroupWriteSerializer`:

- valida carrera y turno dentro de la universidad seleccionada,
- normaliza valores del grupo,
- persiste en transaccion atomica.

### 9.2 Actualizar grupo

`GroupDetailView.put`:

- obtiene el grupo bajo el mismo alcance de periodo activo,
- aplica update parcial,
- responde con detalle actualizado.

## 10) Eliminacion y cambios de estado

### 10.1 Soft delete

`GroupDetailView.delete`:

- marca `is_deleted = 1`,
- no elimina fisicamente la fila.

### 10.2 Toggle status

`GroupToggleStatusView.put`:

- alterna `status` entre activo/inactivo,
- registra accion de auditoria `CHANGE_STATUS`.

## 11) Contrato de paginado

En `GET /api/v1/university/groups/paginated/`:

- `page` (default 1)
- `limit` (default 10)
- `search`
- `career_id`
- `status` (`true`/`false`)
- `sortBy` (`id`, `name`, `period_number`, `letter`, `status`, `career_id`)
- `order` (`ASC`/`DESC`)

## 12) Campos importantes de Groups

- `name`
- `career`
- `period_number`
- `letter`
- `shift`
- `academic_period` (segun politica de universidad)
- `university`
- `status`
- `is_deleted`

## 13) Reglas de consistencia practicas

1. El grupo siempre pertenece a la universidad seleccionada.
2. Las consultas ignoran eliminados logicos.
3. Cuando hay politica por periodo activo, no se deben mezclar grupos de periodos no activos en operaciones funcionales.
4. Toggle-status no debe revivir un registro eliminado (`is_deleted=1`).

## 14) Errores frecuentes

1. `404` al editar grupo existente:
- puede estar fuera del periodo activo cuando `uses_period_groups=1`.

2. Listado vacio inesperado:
- revisar universidad seleccionada,
- revisar si hay periodo activo configurado,
- revisar `status` y `is_deleted`.

3. Error de carrera/turno invalido:
- validar que pertenezcan a la misma universidad seleccionada.

## 15) Impacto en otros modulos

- `schedule_generator` depende de grupos activos para construir nodos de asignacion.
- `dashboard` consume conteos de grupos para score de completitud.
- `careers` define la estructura curricular base para esos grupos.

## 16) Checklist de QA

- [ ] Crear grupo con datos validos.
- [ ] Probar paginado con filtros y ordenamiento.
- [ ] Probar update parcial.
- [ ] Probar delete logico.
- [ ] Probar toggle-status y auditoria.
- [ ] Verificar comportamiento con `uses_period_groups=1` y periodo activo.
- [ ] Verificar comportamiento con `uses_period_groups=0`.

## 17) Resumen ejecutivo

`groups` es el modulo que materializa la estructura operativa por carrera y turno.

Su comportamiento esta fuertemente condicionado por la politica de periodos de la universidad (`uses_period_groups`) y, por ello, es un punto critico para la calidad de datos previa a la generacion de horarios.
