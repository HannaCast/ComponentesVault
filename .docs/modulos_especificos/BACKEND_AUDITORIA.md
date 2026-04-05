# Backend - Auditoria de Datos

## Objetivo

Documentar como funciona la auditoria de datos en backend con enfoque mixto:

- Base de datos (triggers) para operaciones exitosas.
- Backend Django para registrar errores de aplicacion.

## Componentes

1. Tabla `audit_logs` en MySQL.
2. Triggers SQL en:
   - `scripts/base_de_datos/3. horarios-triggers-tablas.sql`
   - `scripts/base_de_datos/4. horarios-triggers-auditoria.sql`
3. Contexto de sesion en backend con `core.audit_context`.

Archivos clave:

- `scripts/base_de_datos/1. horarios-estructura-bd.sql`
- `scripts/base_de_datos/2. horarios-usuarios-bd.sql`
- `scripts/base_de_datos/3. horarios-triggers-tablas.sql`
- `scripts/base_de_datos/4. horarios-triggers-auditoria.sql`
- `horarios_backend/core/audit_context.py`
- `horarios_backend/subjects/views/subjects.py`

## Flujo de auditoria

### 1) Operaciones exitosas (trigger)

Cuando se ejecuta `INSERT`, `UPDATE` o `DELETE` sobre tablas auditadas:

- El trigger inserta una fila en `audit_logs`.
- `is_succesfull` se guarda en `1`.
- Se registran `old_data` y `new_data` segun la operacion.
- Si la conexion es del usuario `api_user`, se considera `source = 'APPLICATION'`.
- En otro caso, `source = 'DATABASE'`.

### 2) Errores de aplicacion (backend)

En endpoints decorados con `@with_audit_context(...)`:

- Se setean variables de sesion para trazabilidad.
- Si ocurre una excepcion, se inserta un log con:
  - `is_succesfull = 0`
  - `error_message = "TipoError: mensaje"`
- Si no hay excepcion pero la respuesta HTTP es error (`status >= 400`), tambien se inserta log de error.

Esto permite cubrir errores que no quedan registrados por triggers (por rollback o por validaciones de app).

## Variables de sesion MySQL usadas

El backend envia:

- `@app_user_id`
- `@app_username`
- `@app_ip`
- `@app_user_agent`
- `@app_transaction_id`
- `@app_action`
- `@app_last_action`

Notas:

- `@app_action` se usa solo de forma puntual para evitar contaminacion entre operaciones.
- `@app_last_action` conserva la ultima accion especial para trazabilidad de error.

## Acciones soportadas

Valores esperados en `audit_logs.action`:

- `CREATE`
- `UPDATE`
- `DELETE`
- `INSERT`
- `CHANGE_STATUS`

## Uso recomendado en vistas

Para metodos de escritura:

1. Decorar con `@with_audit_context(table_name='nombre_tabla')`.
2. Mantener `@transaction.atomic` debajo de `@with_audit_context(...)`.
3. Para acciones especiales, envolver solo la operacion puntual con `with_audit_action('CHANGE_STATUS')`.

Ejemplo conceptual:

```python
@with_audit_context(table_name='subjects')
@transaction.atomic
def put(self, request, pk):
    ...
    with with_audit_action('CHANGE_STATUS'):
        subject.save()
```

## Orden recomendado de scripts SQL

1. `scripts/base_de_datos/1. horarios-estructura-bd.sql`
2. `scripts/base_de_datos/2. horarios-usuarios-bd.sql`
3. `scripts/base_de_datos/3. horarios-triggers-tablas.sql`
4. `scripts/base_de_datos/4. horarios-triggers-auditoria.sql`
5. `scripts/base_de_datos/5. horarios-inserciones.sql` (opcional)

## Revision rapida de los SQL actuales

Estado general: funcionales para el modelo de auditoria actual, con observaciones:

1. `scripts/base_de_datos/1. horarios-estructura-bd.sql`
   - Correcto: tabla `audit_logs` con `is_succesfull` y `error_message`.
   - Ajustado: `action` ahora incluye `INSERT` y `CHANGE_STATUS`.

2. `scripts/base_de_datos/2. horarios-usuarios-bd.sql`
   - Correcto: crea usuario y permisos base para app.
   - Ajustado: `CREATE USER IF NOT EXISTS` para ejecucion idempotente.
   - Recomendacion: en ambientes productivos, usar password segura y host restringido.

3. `scripts/base_de_datos/3. horarios-triggers-tablas.sql`
   - Correcto: registra timestamps y autoria por triggers BEFORE INSERT/UPDATE.

4. `scripts/base_de_datos/4. horarios-triggers-auditoria.sql`
   - Correcto: registra operaciones exitosas y contexto de app/database.
   - Incluye auditoria para `schedule_versions` (INSERT/UPDATE/DELETE).
   - Consideracion: los triggers no llenan `error_message` por si solos; los errores de app los registra backend.

## Validacion sugerida

Pruebas minimas manuales:

1. Crear o actualizar un registro (debe quedar `is_succesfull = 1`).
2. Forzar validacion 400 en endpoint decorado (debe quedar `is_succesfull = 0`).
3. Forzar excepcion en endpoint decorado (debe quedar `is_succesfull = 0` y mensaje).
4. Ejecutar toggle-status (debe registrar `action = CHANGE_STATUS`).
