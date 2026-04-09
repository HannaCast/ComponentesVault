# Documentacion - Restricciones en Create/Update Atomico

Este documento resume los cambios agregados en backend para `subjects` y `classrooms`.

## 1. Cambios de modelo

### 1.1 subjects

Se agrego el campo:

- `subjects.is_restricted_to_classroom_types` (int 0/1)

Se agrego la tabla:

- `subjects_classroom_types`
  - `subject_id`
  - `classroom_type_id`
  - `is_deleted`
  - `created_at`, `created_by`, `updated_at`, `updated_by`

### 1.2 classrooms

Se agrego el campo:

- `classrooms.is_restricted_to_subjects` (int 0/1)

Se agrego la tabla:

- `classroom_subjects`
  - `classroom_id`
  - `subject_id`
  - `is_deleted`
  - `created_at`, `created_by`, `updated_at`, `updated_by`

## 2. Subjects - create/update atomico

Serializer involucrado:

- `subjects/serializers/subjects/subject_write_serializer.py`

### 2.1 Nuevo payload soportado

Campos nuevos en create/update:

- `is_restricted_to_classroom_types` (0 o 1)
- `classroom_types` (lista de ids o objetos con `classroom_type_id|id|value`)

Ejemplo:

```json
{
  "name": "Programacion Web",
  "hours_per_week": 4,
  "color": 1,
  "is_mandatory": 1,
  "is_restricted_to_classroom_types": 1,
  "classroom_types": [
    { "classroom_type_id": 2 },
    { "classroom_type_id": 3 }
  ],
  "careers": [
    { "career_id": 1, "period_number": 3 }
  ],
  "teachers": [
    { "teacher_id": 5 }
  ]
}
```

### 2.2 Reglas aplicadas

- Si `is_restricted_to_classroom_types = 1`, debe enviarse al menos un `classroom_type`.
- Si `is_restricted_to_classroom_types = 0`, la relacion `subjects_classroom_types` queda limpiada (soft delete).
- La sincronizacion de `classroom_types`, `careers` y `teachers` es atomica y usa estrategia de:
  - mantener existentes activos,
  - restaurar soft deleted,
  - crear faltantes,
  - soft delete de relaciones removidas.

## 3. Classrooms - create/update atomico

Serializer involucrado:

- `classrooms/serializers/classrooms/classroom_write_serializer.py`

### 3.1 Nuevo payload soportado

Campos nuevos en create/update:

- `is_restricted` (0 o 1) + `careers` (lista de carreras permitidas)
- `is_restricted_to_subjects` (0 o 1) + `subjects` (lista de materias permitidas)

Ejemplo:

```json
{
  "name": "Laboratorio C-3",
  "classroom_type": 2,
  "code": "C3",
  "is_restricted": 1,
  "careers": [
    { "career_id": 1 },
    { "career_id": 4 }
  ],
  "is_restricted_to_subjects": 1,
  "subjects": [
    { "subject_id": 10 },
    { "subject_id": 12 }
  ]
}
```

### 3.2 Reglas aplicadas

- Si `is_restricted = 1`, debe enviarse al menos una carrera en `careers`.
- Si `is_restricted = 0`, la relacion `classroom_careers` queda limpiada (soft delete).
- Si `is_restricted_to_subjects = 1`, debe enviarse al menos una materia en `subjects`.
- Si `is_restricted_to_subjects = 0`, la relacion `classroom_subjects` queda limpiada (soft delete).
- `careers` y `subjects` se validan contra la universidad seleccionada.

## 4. Migrations agregadas

- `subjects/migrations/0004_subject_restrictions.py`
- `classrooms/migrations/0003_classroom_subject_restrictions.py`

## 5. Nota para generacion de horarios

Los datos de restriccion ya quedan persistidos para uso de la logica de generacion.
En este cambio solo se implemento el alcance solicitado: create/update atomico en `subjects` y `classrooms`.
