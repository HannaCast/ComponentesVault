# BACKEND - Auditoria de Datos

## 1) Proposito de este documento

Este documento describe de extremo a extremo como funciona la auditoria en el sistema:

- que se registra en base de datos,
- que se registra en backend,
- como se construye el contexto de auditoria por request,
- y como interpretar los registros para soporte, QA y trazabilidad.

La meta es que cualquier persona del equipo pueda diagnosticar una operacion funcional sin depender del autor original del modulo.

## 2) Alcance

Este documento cubre:

- tabla `audit_logs` y su semantica,
- triggers SQL de auditoria y de metadatos,
- contexto de auditoria desde Django (`core.audit_context`),
- endpoints API para consultar bitacora,
- y recomendaciones operativas de revision.

Este documento no cubre:

- monitoreo de infraestructura (CPU, RAM, red),
- SIEM externo,
- trazas de APM de terceros.

## 3) Arquitectura de auditoria (modelo mixto)

La auditoria opera en dos capas complementarias:

1. Capa SQL (triggers):
- Registra operaciones exitosas de escritura cuando una fila realmente cambia.
- Captura `old_data`, `new_data`, accion y metadata de usuario/transaccion.

2. Capa backend (Django):
- Registra errores funcionales y excepciones de aplicacion.
- Aporta contexto de negocio que un trigger no ve cuando hay rollback o validacion fallida.

Resultado: la bitacora conserva trazabilidad tanto de operaciones exitosas como de fallos.

## 4) Componentes tecnicos

### 4.1 Base de datos

- Tabla: `audit_logs`
- Scripts relacionados:
  - `scripts/base_de_datos/1. horarios-estructura-bd.sql`
  - `scripts/base_de_datos/3. horarios-triggers-tablas.sql`
  - `scripts/base_de_datos/4. horarios-triggers-auditoria.sql`
  - `scripts/base_de_datos/5. horarios-indices.sql`
  - `scripts/base_de_datos/6. horarios-eventos.sql`

### 4.2 Backend

- Contexto y decoradores:
  - `horarios_backend/core/audit_context.py`
- Endpoints de lectura de bitacora:
  - `horarios_backend/audit/views/audit.py`
  - `horarios_backend/audit/urls/audit.py`

## 5) Modelo de datos audit_logs

Modelo Django:

- `horarios_backend/audit/models.py`

Campos clave y uso:

- `id`: identificador del evento de auditoria.
- `user_id`, `username`: usuario de aplicacion cuando existe contexto.
- `source`: origen del cambio (`APPLICATION` o `DATABASE`).
- `transaction_id`: correlacion entre eventos del mismo request/operacion.
- `table_name`: entidad afectada (ej. `careers`, `groups`, `schedule_versions`).
- `record_id`: PK del registro afectado.
- `action`: tipo de operacion.
- `old_data`: estado anterior (JSON).
- `new_data`: estado nuevo (JSON).
- `ip_address`, `user_agent`: metadata de cliente.
- `is_succesfull`: `1` exitoso, `0` error.
- `error_message`: detalle del error de negocio/aplicacion.
- `created_at`: momento del evento.

## 6) Acciones de auditoria estandar

Conjunto operativo esperado en `action`:

- `CREATE`
- `UPDATE`
- `DELETE`
- `INSERT`
- `CHANGE_STATUS`

Interpretacion sugerida:

- `INSERT` suele representar insercion disparada desde aplicacion.
- `CREATE` puede aparecer en inserciones directas segun estrategia de trigger/procedimiento.
- `CHANGE_STATUS` se usa para toggles funcionales (activar/desactivar).

## 7) Flujo de auditoria de operaciones exitosas

Cuando un endpoint de escritura persiste cambios:

1. El request define contexto de auditoria en sesion MySQL.
2. Se ejecuta la operacion (`INSERT`/`UPDATE`/`DELETE`) en la tabla de negocio.
3. El trigger escribe una fila en `audit_logs` con `is_succesfull = 1`.
4. Se guarda fotografia vieja/nueva (`old_data`/`new_data`) segun tipo de accion.

Esto garantiza trazabilidad transaccional en operaciones confirmadas.

## 8) Flujo de auditoria de errores

Cuando un endpoint decorado falla por validacion o excepcion:

1. El backend mantiene contexto de auditoria para la entidad.
2. Si ocurre error HTTP `>= 400` o excepcion controlada, se registra evento de error.
3. El evento incluye `is_succesfull = 0` y `error_message`.

Valor agregado:

- Permite rastrear fallos que no llegan a trigger por rollback.
- Mejora soporte en incidencias funcionales.

## 9) Contexto de sesion usado por backend

Variables de sesion que el backend establece para auditoria:

- `@app_user_id`
- `@app_username`
- `@app_ip`
- `@app_user_agent`
- `@app_transaction_id`
- `@app_action`
- `@app_last_action`

Uso recomendado:

- `@app_action` para accion puntual de la operacion actual.
- `@app_last_action` para mantener ultima accion relevante ante errores.

## 10) Uso correcto en vistas Django

Patron recomendado para endpoints de escritura:

1. Decorar con `@with_audit_context(table_name='...')`.
2. Combinar con `@transaction.atomic`.
3. Para acciones especiales, envolver el `save` con `with_audit_action('CHANGE_STATUS')`.

Ejemplo conceptual:

```python
@with_audit_context(table_name='groups')
@transaction.atomic
def put(self, request, pk):
    ...
    with with_audit_action('CHANGE_STATUS'):
        group.save()
```

## 11) Endpoints de consulta de auditoria

### 11.1 Lista paginada

- Metodo: `GET`
- Ruta: `/api/v1/audit/logs/paginated/`
- Vista: `AuditLogPaginatedView`
- Permiso: solo administradores (`IsAdmin` via `require_permissions`).

Parametros soportados:

- `page`, `limit`
- `search`
- `entity` (table_name)
- `action` (`CREATE`, `UPDATE`, `DELETE`, `INSERT`, `CHANGE_STATUS`)
- `sortBy`, `order`

### 11.2 Detalle de evento

- Metodo: `GET`
- Ruta: `/api/v1/audit/logs/{pk}/`
- Vista: `AuditLogDetailView`
- Permiso: solo administradores.

## 12) Orden de despliegue SQL recomendado

Para levantar entorno desde cero:

1. `scripts/base_de_datos/1. horarios-estructura-bd.sql`
2. `scripts/base_de_datos/2. horarios-usuarios-bd.sql`
3. `scripts/base_de_datos/3. horarios-triggers-tablas.sql`
4. `scripts/base_de_datos/4. horarios-triggers-auditoria.sql`
5. `scripts/base_de_datos/5. horarios-indices.sql`
6. `scripts/base_de_datos/6. horarios-eventos.sql`
7. `scripts/base_de_datos/7. horarios-catalogos-base.sql`
8. `scripts/base_de_datos/8. horarios-datos-prueba.sql` (opcional)

## 13) Casos de uso de revision operativa

Escenario 1: validar una alta de carrera

1. Ejecutar alta desde frontend.
2. Buscar en bitacora por `table_name = careers`.
3. Confirmar `is_succesfull = 1` y `action` esperado.
4. Revisar `new_data` para verificar payload persistido.

Escenario 2: validar error de negocio

1. Enviar request invalido (ej. regla de validacion).
2. Revisar bitacora por `transaction_id` o usuario.
3. Confirmar `is_succesfull = 0`.
4. Revisar `error_message` para diagnostico.

Escenario 3: validar toggles de estado

1. Ejecutar endpoint `toggle-status`.
2. Confirmar evento con `action = CHANGE_STATUS`.
3. Validar `old_data.status` y `new_data.status`.

## 14) Errores frecuentes y como resolverlos

1. No aparecen eventos de auditoria en escritura:
- Verificar que el endpoint este decorado con `@with_audit_context`.
- Verificar instalacion/ejecucion de triggers en base de datos.

2. Solo aparecen eventos exitosos pero no errores:
- Revisar manejo de errores en la vista.
- Revisar que el flujo no este saliendo antes del contexto de auditoria.

3. Falta `username` o `user_id`:
- Revisar que el request este autenticado cuando aplique.
- Revisar inyeccion de variables de sesion en `core.audit_context`.

4. Lentitud en busquedas de bitacora:
- Revisar indices de `scripts/base_de_datos/5. horarios-indices.sql`.
- Evitar filtros demasiado amplios sin paginacion.

## 15) Checklist de calidad para este modulo

- [ ] Endpoints de escritura decorados con auditoria.
- [ ] Triggers activos en entorno local y productivo.
- [ ] Lista paginada responde con filtros/ordenamiento esperados.
- [ ] Errores de negocio generan evento con `is_succesfull = 0`.
- [ ] Toggle-status registra `CHANGE_STATUS`.
- [ ] Equipo de soporte conoce uso de `transaction_id` para correlacion.

## 16) Resumen ejecutivo

La auditoria del sistema combina triggers SQL y contexto backend para cubrir dos necesidades:

- Trazabilidad fuerte de cambios persistidos.
- Observabilidad funcional de errores de aplicacion.

Con este enfoque, la bitacora permite soporte tecnico, validacion de negocio y control operativo con evidencia consistente por entidad, usuario y transaccion.
