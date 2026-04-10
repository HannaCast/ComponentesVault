# BACKEND - Funcionamiento de Generacion de Horarios

## 1) Proposito de este documento

Este documento explica, de forma completa y paso a paso, como funciona el backend para generar horarios academicos.

Esta pensado para una persona que no conoce el modulo.

Al terminar de leerlo, debes poder responder:

- Que endpoints existen y para que sirve cada uno.
- Que valida el backend antes de generar.
- Como el algoritmo decide cada bloque de clase.
- Que se guarda en base de datos y como se versiona.
- Como se maneja auditoria, trazabilidad y errores.

## 2) Alcance

Este documento cubre solo backend.

Incluye:

- API (views, serializers, servicios).
- Pipeline interno de generacion.
- Versionamiento en tabla schedule_versions.
- Integracion con user_configurations para tracking de borradores.
- Triggers y auditoria relacionados.

No incluye:

- UX del frontend.
- Diseño visual del calendario.

## 3) Mapa rapido del flujo

Flujo principal cuando llega POST de generacion:

1. Entra por endpoint de generate.
2. Se valida autenticacion y universidad seleccionada.
3. Se valida payload de entrada (serializer).
4. Se ejecuta pipeline de generacion (loaders + grafo + DSatur + formatter).
5. Se crea o actualiza un borrador en schedule_versions.
6. Se sincroniza user_configurations.schedule_generation.draft_schedule_university_ids.
7. Se responde la version completa (detalle).

## 4) Ubicacion del modulo en el backend

App Django: schedule_generator

Archivos clave:

- horarios_backend/schedule_generator/urls/schedules.py
- horarios_backend/schedule_generator/views/schedule_versions.py
- horarios_backend/schedule_generator/services/schedule_generation_service.py
- horarios_backend/schedule_generator/services/schedule_versions_service.py
- horarios_backend/schedule_generator/models/schedule_versions.py
- horarios_backend/schedule_generator/serializers/schedule_versions/
- horarios_backend/schedule_generator/generation_logic/

Submodulos de generation_logic:

- loaders: obtiene datos desde BD.
- graph: construye nodos, conflictos y resuelve asignacion.
- constraints: reglas duras y penalizaciones blandas.
- formatter: transforma resultado interno a payload final de API.

## 5) Endpoints activos (backend)

Nota de ruteo:

- En urls raiz del proyecto se hace include de schedule_generator bajo prefijo /api/.
- Por eso las rutas reales quedan bajo /api/...

### 5.1 Generar y persistir borrador

- Metodo: POST
- Ruta: /api/v1/university/schedules/generate/
- Vista: ScheduleVersionGenerateView
- Serializer entrada: ScheduleVersionGenerateSerializer
- Servicio principal: generate_or_update_draft_schedule_version

Que hace:

- Ejecuta toda la generacion.
- Guarda resultado en schedule_versions (create o update de borrador activo).
- Si no existe borrador, crea uno nuevo con label por defecto: Borrador YYYY-MM-DD HH:MM.
- Si ya existe borrador, regenera contenido del borrador y conserva su label actual.
- En parameters, el campo uses_period_groups siempre se fuerza desde backend.

### 5.2 Actualizar borrador existente

- Metodo: PUT
- Ruta: /api/v1/university/schedules/drafts/{id}/
- Vista: ScheduleVersionDraftDetailView.put
- Serializer entrada: ScheduleVersionUpdateDraftSerializer
- Servicio principal: update_draft_schedule_version

Que hace:

- Actualiza campos permitidos en borrador no confirmado.

### 5.3 Eliminar borrador (soft delete)

- Metodo: DELETE
- Ruta: /api/v1/university/schedules/drafts/{id}/
- Vista: ScheduleVersionDraftDetailView.delete
- Servicio principal: delete_draft_schedule_version

Que hace:

- Marca is_deleted=1 en borrador no confirmado.

### 5.4 Confirmar version

- Metodo: PUT
- Ruta: /api/v1/university/schedules/{id}/confirm/
- Vista: ScheduleVersionConfirmView
- Servicio principal: confirm_schedule_version

Que hace:

- Cambia is_confirmed=1.
- Escribe confirmed_at con timestamp actual.

### 5.5 Cambiar solo label

- Metodo: PUT
- Ruta: /api/v1/university/schedules/{id}/label/
- Vista: ScheduleVersionLabelView
- Serializer entrada: ScheduleVersionUpdateLabelSerializer
- Servicio principal: update_schedule_version_label

### 5.6 Historial paginado

- Metodo: GET
- Ruta: /api/v1/university/schedules/paginated/
- Vista: ScheduleVersionPaginatedView
- Servicio base: get_schedule_versions_queryset

Query params soportados:

- page (default 1)
- limit (default 10)
- search (filtro por label)
- confirmed=true|false

### 5.7 Detalle por id

- Metodo: GET
- Ruta: /api/v1/university/schedules/{id}/
- Vista: ScheduleVersionDetailView
- Servicio base: get_schedule_version_by_id

### 5.8 Ruta legada solo preview (sin persistencia)

- Metodo: POST
- Ruta: /api/schedule-generator/preview/
- Vista: ScheduleGeneratorPreviewView
- Servicio: generate_schedule

Que hace:

- Corre algoritmo en memoria.
- No crea ni actualiza schedule_versions.

## 6) Seguridad y contexto de ejecucion

Todos los endpoints de schedule_generator usan:

- IsAuthenticated
- RequireSelectedUniversity

RequireSelectedUniversity:

- Obtiene selected_university_id desde user_configurations del usuario autenticado.
- Si no existe universidad seleccionada, rechaza acceso.
- Si existe, adjunta request.selected_university_id para reutilizar en vista/servicio.

Esto garantiza que todas las operaciones de horario queden acotadas a la universidad seleccionada por el usuario.

## 7) Modelo persistente schedule_versions

Tabla: schedule_versions

Campos y funcion:

- id: PK de la version.
- label: nombre visible de la version.
- university_id: dueña de la version.
- academic_period_id: periodo academico asociado (puede ser null).
- parameters (JSON): parametros adicionales de generacion.
- data (JSON): horario generado completo.
- assigned_count: total de bloques asignados.
- unassigned_count: total de bloques no asignados.
- is_confirmed: 0 borrador, 1 confirmado.
- confirmed_at: fecha de confirmacion.
- is_deleted: soft delete.
- created_at, created_by, updated_at, updated_by: auditoria de autoria/tiempo.

Regla importante:

- El backend no llena manualmente created_* ni updated_*.
- Esos campos se llenan por triggers de base de datos.

## 8) Validaciones de entrada (serializers)

### 8.1 ScheduleVersionGenerateSerializer

Campos:

- label: opcional, max 100, admite null/vacio por compatibilidad de payload.
- parameters: JSON object opcional (default dict).
- is_confirmed: HiddenField default 0.
- is_deleted: HiddenField default 0.

Validaciones:

- label no se usa para nombrar en generate/regenerate.
- parameters debe ser objeto JSON.

### 8.2 ScheduleVersionUpdateDraftSerializer

Campos permitidos de update:

- label
- academic_period_id
- parameters
- data
- assigned_count
- unassigned_count

Validaciones:

- Debe enviarse al menos 1 campo.
- label no vacio.
- parameters y data deben ser objetos JSON.
- contadores minimos en 0.

### 8.3 ScheduleVersionUpdateLabelSerializer

- Solo acepta label.
- Se trimmea y no puede quedar vacio.

## 9) Flujo completo de generacion (detalle tecnico)

Funcion orquestadora: generate_schedule(university_id)

### Paso 1: Cargar contexto institucional

Loader: load_university_context

Valida y obtiene:

- Universidad activa (status=1, is_deleted=0).
- uses_period_groups real desde la universidad.
- active_period_id si existe periodo activo.

Errores posibles:

- UNIVERSITY_NOT_FOUND

### Paso 2: Cargar grupos objetivo

Loader: load_active_groups

Reglas:

- Filtra grupos activos y relaciones activas (career, shift).
- Si uses_period_groups=1, exige active_period_id y filtra grupos de ese periodo.
- Excluye combinaciones carrera/periodo declaradas en career_period_exceptions.
- Lee allowed_days desde modality.configurations.
- Normaliza allowed_days al rango 1..7, fallback L-V.

Errores posibles:

- NO_ACTIVE_PERIOD
- NO_ACTIVE_GROUPS (si despues de filtros no quedan grupos)

### Paso 3: Cargar aulas disponibles

Loader: load_classrooms_for_university

Reglas:

- Solo aulas activas y no eliminadas.
- Si aula es restringida, se cargan carreras permitidas desde classroom_careers.
- Si aula tiene `is_restricted_to_subjects = 1`, se cargan materias permitidas desde classroom_subjects.

### Paso 4: Cargar materias por grupo

Loader: load_subjects_for_group(career_id, period_number)

Reglas:

- Trae materias activas de career_subjects.
- Si la materia tiene `is_restricted_to_classroom_types = 1`, se cargan tipos de aula permitidos desde subjects_classroom_types.
- Lee color y contrast_hex para salida visual.
- hours_per_week se fuerza a minimo 1 para evitar materia sin nodos.

### Paso 5: Construir slots por grupo

Loader: build_time_slots

Reglas:

- Usa shift_start y shift_end del turno del grupo.
- Usa allowed_days de modalidad.
- Duracion por slot: 60 minutos.
- Crea bloques consecutivos por dia mientras current + delta <= fin_turno.

### Paso 6: Cargar profesores candidatos por materia

Loader: load_teachers_for_subject

Pipeline interno:

1. Profesores ligados a materia (teachers_subjects).
2. Interseccion con profesores activos en la universidad (teachers_universities).
3. Perfil de profesor activo (teachers).
4. Disponibilidad semanal (teacher_availabilities).

Regla de disponibilidad:

- Si no hay configuracion de disponibilidad para ese dia, se asume disponible.
- Bloques marcados no disponibles bloquean primero.
- Si hay bloques disponibles explicitos, el slot debe caber completo dentro de alguno.

### Paso 7: Construir nodos del grafo

Builder: build_schedule_nodes

Reglas:

- Cada hora semanal de una materia crea 1 nodo.
- node_key incluye group, subject, career_subject y numero de hora.
- Cada nodo solo puede usar slots permitidos del propio grupo (allowed_slot_ids).
- Cada nodo mantiene metadata de restriccion por tipo de aula de su materia para validarla al elegir aula.

### Paso 8: Construir adyacencia (conflictos)

Builder: build_schedule_adjacency

Conflictos duros modelados como aristas:

- Todos los nodos del mismo grupo se conectan entre si (no dos clases al mismo tiempo).
- Todos los nodos que comparten profesor candidato se conectan entre si.

### Paso 9: Resolver con DSatur adaptado

Solver: run_dsatur_coloring

Estrategia:

1. Selecciona siguiente nodo por mayor saturacion y luego mayor grado.
2. Filtra slots candidatos:
   - no colisionar con colores de vecinos ya asignados.
   - pertenecer a allowed_slot_ids del nodo.
3. Elige profesor factible (no ocupado + disponible) priorizando menor carga actual.
4. Si requiere aula (por modalidad o por profesor), elige aula factible por reglas de ocupacion y restricciones:
   - por carrera (classroom_careers),
   - por materia (classroom_subjects),
   - y por tipo de aula permitido para la materia (subjects_classroom_types).
5. Calcula penalizacion blanda del slot (balance semanal y preferencia temporal).
6. Selecciona la mejor combinacion por ranking.
7. Confirma asignacion y actualiza ocupaciones:
   - teacher_busy
   - classroom_busy
   - teacher_load
   - group_day_load

Si no encuentra opcion factible, marca nodo como unassigned.

Razones de no asignacion usadas por el solver:

- NO_AVAILABLE_SLOTS
- NO_TEACHER_FOR_SUBJECT
- NO_GRAPH_COLOR_AVAILABLE
- NO_FEASIBLE_ASSIGNMENT

### Paso 10: Formatear payload final

Formatter: format_generated_schedule

Salida:

- university_id
- generated_at (UTC ISO)
- uses_period_groups
- active_academic_period (objeto o null)
- groups[] con blocks[]
- unassigned[]
- summary

Metadatos enriquecidos por grupo dentro de groups[]:

- career_id (compatibilidad)
- career: { id, name, short_name, code }
- shift: { id, name, start_time, end_time }
- academic_period: { id, name, year, order } (o null)
- allowed_days: dias habilitados para representar la rejilla en frontend

Resumen summary:

- groups_scheduled
- total_blocks_assigned
- total_blocks_unassigned

Error global de esta fase:

- NO_SCHEDULABLE_SUBJECTS (si despues de construir nodos no hay nada agendable)

## 10) Persistencia y versionamiento (generate_or_update_draft_schedule_version)

Este servicio hace dos cosas en una sola transaccion:

1. Ejecuta la generacion completa.
2. Crea o actualiza el borrador activo de la universidad.

### 10.1 Construccion de metadatos

- Toma assigned_count y unassigned_count desde summary.
- Resuelve academic_period a partir del active_period_id del contexto institucional.
- Construye parameters y sobrescribe uses_period_groups con el valor institucional del backend.
- En data persiste metadata enriquecida de cada grupo (career, shift, academic_period, allowed_days).

### 10.2 Regla de un borrador activo por universidad

Consulta:

- schedule_versions de la universidad con is_deleted=0 e is_confirmed=0.
- Ordenado por id desc.

Comportamiento:

- Si no existe borrador: create.
- Si existe: update del mas reciente.
- Si hay duplicados historicos: los extras se marcan is_deleted=1.

### 10.3 Label por defecto

En la creacion inicial del borrador:

- Se usa formato: Borrador YYYY-MM-DD HH:MM

En regeneraciones sobre borrador existente:

- Se conserva el label actual del borrador.
- El generate no renombra aunque el payload traiga label.

### 10.4 Tracking en user_configurations

Despues de create/update:

- Se agrega university_id a schedule_generation.draft_schedule_university_ids.

## 11) Flujo de update draft

Servicio: update_draft_schedule_version

Reglas:

- Solo permite version de la universidad, no eliminada, no confirmada.
- Si no cumple, error DRAFT_NOT_FOUND.
- Actualiza solo campos presentes en payload.

Campos editables:

- label
- academic_period
- parameters
- data
- assigned_count
- unassigned_count

## 12) Flujo de delete draft

Servicio: delete_draft_schedule_version

Reglas:

- Solo sobre no confirmadas.
- Soft delete: is_deleted=1.
- Elimina university_id de draft_schedule_university_ids.

Error posible:

- DRAFT_NOT_FOUND

## 13) Flujo de confirmacion

Servicio: confirm_schedule_version

Reglas:

- Busca version de la universidad, no eliminada.
- Si no existe, error VERSION_NOT_FOUND.
- Si no estaba confirmada:
  - is_confirmed=1
  - confirmed_at=timezone.now()
- Remueve university_id de draft_schedule_university_ids.

## 14) Flujo de update label

Servicio: update_schedule_version_label

Reglas:

- Busca version por id y universidad (no eliminada).
- Si no existe, error VERSION_NOT_FOUND.
- Actualiza solo label.

## 15) Lectura de historial y detalle

### 15.1 Historial paginado

Base queryset:

- Filtra university_id e is_deleted=0.
- order_by(-created_at, -id).

Filtros opcionales:

- search por label__icontains.
- confirmed=true|false.

### 15.2 Detalle

- Busca por id + university_id + is_deleted=0.
- Si no existe, retorna not_found.

## 16) Contrato de respuesta de una version

Detail serializer devuelve:

- id
- label
- academic_period (objeto o null)
- parameters
- data
- assigned_count
- unassigned_count
- is_confirmed
- confirmed_at
- created_at
- updated_at

List serializer devuelve:

- id
- label
- academic_period
- assigned_count
- unassigned_count
- is_confirmed
- confirmed_at
- created_at
- updated_at

Detalle del campo data (payload generado):

- active_academic_period: periodo activo institucional (cuando exista)
- groups[]: cada grupo incluye metadata de carrera y turno, ademas de blocks[]
- El intervalo de tiempo del turno queda disponible en groups[].shift.start_time/end_time para que frontend pueda renderizar slots vacios dentro del rango del turno.

## 17) Errores de negocio y su origen

Errores de generacion:

- NO_UNIVERSITY_SELECTED
- UNIVERSITY_NOT_FOUND
- NO_ACTIVE_GROUPS
- NO_SCHEDULABLE_SUBJECTS
- NO_ACTIVE_PERIOD
- ACADEMIC_PERIOD_NOT_FOUND

Errores de versionamiento:

- DRAFT_NOT_FOUND
- VERSION_NOT_FOUND

Mapeo de estado HTTP en vistas:

- DRAFT_NOT_FOUND y VERSION_NOT_FOUND -> 404.
- Resto de negocio en este flujo -> 422.
- Errores de serializer -> respuesta de validacion estandar ApiResponse.error.

## 18) Auditoria y responsabilidades entre app y BD

### 18.1 Decorador de contexto de auditoria

En operaciones de escritura se usa with_audit_context(table_name='schedule_versions').

Se setean variables de sesion MySQL:

- @app_user_id
- @app_username
- @app_ip
- @app_user_agent
- @app_transaction_id
- @app_action
- @app_last_action

Y al finalizar se limpian.

### 18.2 Triggers de autoria/timestamps

Archivo SQL:

- scripts/base_de_datos/3. horarios-triggers-tablas.sql

Triggers:

- trg_schedule_versions_before_insert
- trg_schedule_versions_before_update

Responsabilidad:

- Llenar created_at/created_by y updated_at/updated_by en insert.
- Actualizar updated_at/updated_by en update.

### 18.3 Triggers de audit_logs

Archivo SQL:

- scripts/base_de_datos/4. horarios-triggers-auditoria.sql

Triggers:

- trg_audit_schedule_versions_after_insert
- trg_audit_schedule_versions_after_update
- trg_audit_schedule_versions_after_delete

Responsabilidad:

- Registrar old_data/new_data en audit_logs.
- Incluir JSON parameters y data dentro del payload auditado.

## 19) Reglas funcionales clave (resumen)

1. Toda operacion se acota a selected_university_id del usuario.
2. Solo existe un borrador activo por universidad (duplicados heredados se limpian con soft delete).
3. Confirmar version libera el tracking de borrador para esa universidad.
4. Eliminar borrador es logico, no fisico.
5. Backend no escribe campos created_*/updated_* en schedule_versions.
6. En generate/regenerate, el label del borrador se crea por default y despues se conserva.
7. En parameters, uses_period_groups siempre lo determina backend segun la universidad seleccionada.
8. Las restricciones de aula por carrera, por materia y por tipo de aula se aplican como reglas duras durante la asignacion.
9. Si no hay datos minimos para agendar, se devuelve error de negocio explicito.

## 20) Guia de depuracion para personas nuevas

Si falla la generacion, revisar en este orden:

1. Universidad seleccionada en user_configurations.
2. Universidad activa y no eliminada.
3. Si usa periodos por grupo, validar periodo activo.
4. Que existan grupos activos para esa universidad.
5. Que existan materias activas para carrera/periodo de esos grupos.
6. Que existan profesores ligados a materias y habilitados en la universidad.
7. Disponibilidad de profesores por dia/hora.
8. Disponibilidad de slots dentro del turno y allowed_days.
9. Si requiere aula, validar aulas y restricciones por carrera, por materia y por tipo de aula.
10. Revisar unassigned[] para entender por que no se pudo asignar cada nodo.

Si hay duda de persistencia o auditoria:

1. Confirmar que se ejecutaron scripts de triggers.
2. Confirmar que el usuario MySQL de la API sea api_user (para source APPLICATION).
3. Revisar audit_logs por transaction_id y table_name='schedule_versions'.

## 21) Resumen operativo final

El backend de generacion de horarios hace tres cosas grandes:

1. Calcula un horario factible con restricciones reales (grupo, profesor, aula, disponibilidad).
2. Lo guarda como version de horario con estrategia de borrador/confirmado.
3. Deja trazabilidad completa mediante contexto de auditoria y triggers SQL.

Con esto, el sistema no solo genera horarios: tambien permite administrarlos como versiones auditables y seguras por universidad.