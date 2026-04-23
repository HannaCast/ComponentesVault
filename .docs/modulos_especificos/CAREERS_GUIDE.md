# BACKEND - Modulo Careers (Carreras, Materias por Carrera y Excepciones)

## 1) Proposito de este documento

Este documento explica con nivel operativo el modulo `careers`:

- como se estructura el dominio,
- que endpoints existen,
- que valida cada capa,
- como se sincronizan excepciones de periodo,
- y como impacta a otros modulos (grupos, aulas y generador de horarios).

## 2) Alcance

Incluye:

- `Careers`
- `CareerSubjects`
- `CareerPeriodExceptions`
- relaciones con universidad/modalidad/materias
- convencion de borrado logico y status

No incluye:

- modulo `groups` en detalle profundo (documentado en `GROUPS_GUIDE.md`),
- UI visual del frontend.

## 3) Mapa funcional rapido

1. El usuario crea una carrera en su universidad seleccionada.
2. El backend valida modalidad, periodos y reglas de dominio.
3. Se pueden registrar excepciones de periodo (periodos sin generacion).
4. Se registran materias asociadas a la carrera por periodo.
5. El generador de horarios consume estas estructuras para construir asignaciones.

## 4) Ubicacion del modulo en el backend

Archivos clave:

- `horarios_backend/careers/models/careers.py`
- `horarios_backend/careers/models/career_subjects.py`
- `horarios_backend/careers/models/career_period_exceptions.py`
- `horarios_backend/careers/views/careers.py`
- `horarios_backend/careers/views/career_subjects.py`
- `horarios_backend/careers/views/career_period_exceptions.py`
- `horarios_backend/careers/serializers/careers/career_write_serializer.py`
- `horarios_backend/careers/urls/careers.py`
- `horarios_backend/careers/urls/career_subjects.py`
- `horarios_backend/careers/urls/career_period_exceptions.py`

## 5) Modelo de datos y relaciones

### 5.1 Careers

Representa una carrera academica de una universidad.

Campos frecuentes:

- `name`, `short_name`, `code`
- `modality`
- `total_periods`
- `status`
- `is_deleted`

Relaciones:

- pertenece a una universidad,
- pertenece a una modalidad,
- tiene muchas materias planificadas (`career_subjects`),
- tiene muchas excepciones de periodo (`career_period_exceptions`).

### 5.2 CareerSubjects

Relaciona carrera + materia + periodo del plan.

Objetivo:

- declarar que materias se cursan por periodo en una carrera,
- servir como base de consulta para generacion y validaciones cruzadas.

### 5.3 CareerPeriodExceptions

Define periodos que se excluyen de generacion para una carrera (ej. estadias, practicas, bloques especiales).

## 6) Seguridad y contexto

Todos los endpoints funcionales del modulo usan:

- `IsAuthenticated`
- `RequireSelectedUniversity`

Efecto practico:

- toda lectura/escritura se limita a la universidad seleccionada del usuario,
- evita cruces de datos entre universidades.

## 7) Endpoints de Careers

### 7.1 Lista para selects

- Metodo: `GET`
- Ruta: `/api/v1/university/careers/`
- Vista: `CareerListView.get`
- Retorna carreras activas (`status=1`) y no eliminadas (`is_deleted=0`).

### 7.2 Crear carrera

- Metodo: `POST`
- Ruta: `/api/v1/university/careers/`
- Vista: `CareerListView.post`
- Serializer: `CareerWriteSerializer`
- Auditoria: `@with_audit_context(table_name='careers')`

### 7.3 Lista paginada

- Metodo: `GET`
- Ruta: `/api/v1/university/careers/paginated/`
- Vista: `CareerPaginatedView.get`
- Query params: `page`, `limit`, `search`, `status`, `sortBy`, `order`.

### 7.4 Detalle por id

- Metodo: `GET`
- Ruta: `/api/v1/university/careers/{id}/`
- Vista: `CareerDetailView.get`

### 7.5 Actualizar carrera

- Metodo: `PUT`
- Ruta: `/api/v1/university/careers/{id}/`
- Vista: `CareerDetailView.put`
- Soporta `partial=True`.

### 7.6 Eliminar carrera (soft delete)

- Metodo: `DELETE`
- Ruta: `/api/v1/university/careers/{id}/`
- Vista: `CareerDetailView.delete`
- Marca `is_deleted = 1`.

### 7.7 Toggle status

- Metodo: `PUT`
- Ruta: `/api/v1/university/careers/{id}/toggle-status/`
- Vista: `CareerToggleStatusView.put`
- Alterna `status` entre `1` y `0`.

## 8) Endpoints de CareerSubjects

### 8.1 Lista

- Metodo: `GET`
- Ruta: `/api/v1/university/career-subjects/`
- Vista: `CareerSubjectListView.get`

### 8.2 Crear relacion carrera-materia

- Metodo: `POST`
- Ruta: `/api/v1/university/career-subjects/`
- Vista: `CareerSubjectListView.post`
- Auditoria: tabla `career_subjects`.

### 8.3 Detalle

- Metodo: `GET`
- Ruta: `/api/v1/university/career-subjects/{id}/`

### 8.4 Actualizar

- Metodo: `PUT`
- Ruta: `/api/v1/university/career-subjects/{id}/`

### 8.5 Eliminar (soft delete)

- Metodo: `DELETE`
- Ruta: `/api/v1/university/career-subjects/{id}/`

## 9) Endpoints de CareerPeriodExceptions

### 9.1 Lista

- Metodo: `GET`
- Ruta: `/api/v1/university/career-period-exceptions/`
- Vista: `CareerPeriodExceptionListView.get`
- Query opcional: `career=<id>`.

### 9.2 Crear excepcion

- Metodo: `POST`
- Ruta: `/api/v1/university/career-period-exceptions/`

### 9.3 Detalle

- Metodo: `GET`
- Ruta: `/api/v1/university/career-period-exceptions/{id}/`

### 9.4 Actualizar

- Metodo: `PUT`
- Ruta: `/api/v1/university/career-period-exceptions/{id}/`

### 9.5 Eliminar (soft delete)

- Metodo: `DELETE`
- Ruta: `/api/v1/university/career-period-exceptions/{id}/`

## 10) Validaciones criticas de CareerWriteSerializer

Archivo:

- `horarios_backend/careers/serializers/careers/career_write_serializer.py`

Reglas destacadas:

1. `total_periods > 0`.
2. La modalidad debe pertenecer a la universidad seleccionada.
3. `period_exceptions` no puede tener periodos duplicados.
4. Ningun `period_number` de excepcion puede ser mayor a `total_periods`.
5. En `create`, fuerza:
- `university_id` desde contexto,
- `status = 1`,
- `is_deleted = 0`.

## 11) Sincronizacion de period_exceptions en create/update

Comportamiento del serializer:

- En `create`: crea carrera y, si llegan excepciones, las inserta como activas.
- En `update`: si el request incluye `period_exceptions`, sincroniza lista completa.

Estrategia actual de sincronizacion:

1. soft-delete de excepciones activas previas (`is_deleted=1`),
2. insercion de nuevas excepciones enviadas.

Beneficio:

- evita estado intermedio inconsistente,
- deja la lista exacta del payload.

## 12) Reglas de ciclo de vida

Se aplican dos banderas separadas:

- `status`: activo/inactivo funcional,
- `is_deleted`: borrado logico.

Interpretacion:

- Un registro puede existir historicamente (`is_deleted=0`) pero estar inactivo (`status=0`).
- Un registro eliminado logicamente deja de aparecer en consultas funcionales.

## 13) Integracion con otros modulos

### 13.1 Groups

- Los grupos dependen de carrera para estructura academica.

### 13.2 Classrooms

- El modulo de aulas usa `CareerSubjects` para filtros de materias por carrera y periodo.

### 13.3 Schedule generator

- La generacion de horarios necesita carreras, grupos y materias por carrera para construir la matriz de asignacion.

## 14) Errores comunes y diagnostico

1. Error de modalidad no perteneciente a universidad:
- revisar `selected_university_id` y `modality` enviada.

2. Error por excepcion fuera de rango:
- revisar `total_periods` y `period_exceptions.period_number`.

3. No aparecen carreras en selects:
- verificar `status=1`, `is_deleted=0` y universidad seleccionada.

4. No aparecen relaciones de career_subjects:
- validar que carrera y materia no esten eliminadas logicamente.

## 15) Ejemplo de payload compuesto (carrera + excepciones)

```json
{
  "name": "Desarrollo de Software Multiplataforma",
  "short_name": "DSM",
  "code": "DSM-01",
  "modality": 1,
  "total_periods": 9,
  "period_exceptions": [
    { "period_number": 9, "reason": "Estadia profesional" }
  ]
}
```

## 16) Checklist de QA

- [ ] Crear carrera valida en universidad seleccionada.
- [ ] Probar carrera con excepciones validas.
- [ ] Probar excepcion con periodo fuera de rango (debe fallar).
- [ ] Probar periodos duplicados en `period_exceptions` (debe fallar).
- [ ] Probar toggle-status y verificar auditoria.
- [ ] Probar soft delete y confirmar ocultamiento en listados.

## 17) Resumen ejecutivo

El modulo `careers` concentra la base curricular:

- define carreras,
- vincula materias por periodo,
- y declara excepciones de periodo para la generacion.

Su correcta configuracion es prerequisite directo para `groups`, `classrooms` y `schedule_generator`.
