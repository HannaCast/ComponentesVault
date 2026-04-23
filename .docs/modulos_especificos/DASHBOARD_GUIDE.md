# FRONTEND/BACKEND - Modulo Dashboard Operativo

## 1) Proposito de este documento

Explicar el dashboard institucional de usuario como modulo funcional completo:

- que consulta backend,
- como interpreta los datos,
- como renderiza KPIs y completitud,
- y como guía la preparacion para generar horarios.

## 2) Alcance

Incluye:

- endpoint backend de resumen,
- estructura del modulo frontend,
- flujo de carga, cache y dedupe,
- comportamiento con y sin universidad seleccionada,
- mensajes de apoyo y accesos rapidos.

No incluye:

- diseño visual detallado de tokens CSS,
- analitica externa.

## 3) Flujo funcional rapido

1. El usuario entra a `/usuario/dashboard`.
2. Si hay universidad seleccionada, frontend consulta resumen consolidado.
3. Backend responde contexto, borrador, conteos y score de completitud.
4. UI muestra:
- hero de contexto,
- tarjetas KPI,
- estado de borrador,
- checklist de avance,
- accesos rapidos,
- pasos para generar horarios.

## 4) Backend del dashboard

### 4.1 Endpoint principal

- Metodo: `GET`
- Ruta: `/api/v1/university/dashboard/summary/`
- Vista: `UniversityDashboardSummaryView`
- Permisos: `IsAuthenticated`, `RequireSelectedUniversity`

### 4.2 Archivos backend clave

- `horarios_backend/user_accounts/views/dashboard.py`
- `horarios_backend/user_accounts/urls/dashboard.py`
- `horarios_backend/user_accounts/urls/__init__.py`

### 4.3 Datos devueltos

Bloques principales:

- `university`
- `schedule_generation`
- `counts`
- `completion`

## 5) Contrato de respuesta (resumen)

### 5.1 university

- `id`, `name`, `short_name`
- `uses_period_groups`
- `active_period_name`

### 5.2 schedule_generation

- `has_draft`
- `draft_version_id`
- `draft_version_label`
- `draft_created_at`
- `draft_origin` (`schedule_versions` o `user_configuration`)

### 5.3 counts

- `careers`: `total`, `active`
- `subjects`: `total`, `active`
- `groups`: `total`, `active`, `scoped_to_active_period`
- `teachers`: `total`, `active`, `with_availability`, `without_availability`
- `classrooms`: `total`, `active`

### 5.4 completion

- `score_percentage`
- `completed_modules`
- `total_modules`
- `items[]` (checklist con `is_complete`, `hint`, `target`, `current`)

## 6) Criterios de conteo del backend

1. Conteos solo sobre datos no eliminados logicamente (`is_deleted=0`).
2. `groups` se restringe al periodo activo cuando `uses_period_groups=1`.
3. `teachers.with_availability` considera al menos un bloque activo disponible (`is_available=1`).
4. `has_draft` se determina por presencia de borrador en `schedule_versions` y/o tracking en `user_configuration`.

## 7) Frontend del dashboard

### 7.1 Estructura de carpetas

```text
modules/user/features/dashboard/
  api/
    dashboardApi.js
  hooks/
    useDashboard.js
  components/
    DashboardHero.jsx
    DashboardMetricCards.jsx
    DashboardDraftAlert.jsx
    DashboardCompletionPanel.jsx
    DashboardQuickAccess.jsx
    DashboardScheduleSteps.jsx
  pages/
    UserHomePage.jsx
```

### 7.2 Archivos de integracion

- rutas: `horarios_frontend/src/core/routes/UserRouter.jsx`
- navegacion sidebar: `horarios_frontend/src/core/navigation/userMenuItems.js`
- layout/encabezado: `horarios_frontend/src/modules/user/layout/UserLayout.jsx`, `horarios_frontend/src/shared/components/layout/Header.jsx`

## 8) Flujo de carga en frontend

1. `UserHomePage` valida estado de sesion y universidad.
2. Si hay universidad seleccionada, invoca `useDashboard` para pedir summary.
3. `useDashboard` maneja:
- estado de carga,
- dedupe de requests,
- cache temporal en memoria,
- refresco manual (`force`) cuando aplica.
4. UI compone paneles por bloques de datos.

## 9) Estado sin universidad seleccionada

El dashboard permanece accesible sin universidad activa para evitar pantalla bloqueada.

En ese estado:

- no se consulta `/dashboard/summary`,
- se muestra contexto neutro,
- se muestra alerta para seleccionar universidad,
- se mantienen accesos rapidos y pasos de preparacion.

## 10) Seccion "Pasos para generar horarios"

Componente:

- `DashboardScheduleSteps.jsx`

Objetivo:

- guiar de forma no tecnica al usuario sobre prerequisitos.

Secuencia propuesta al usuario:

1. Seleccionar universidad y periodo activo.
2. Configurar base academica (carreras, materias, grupos).
3. Completar profesores/disponibilidad y aulas.
4. Generar o actualizar borrador.
5. Revisar resultado y confirmar version.

Mensajes frecuentes mostrados:

- No hay universidad seleccionada.
- No hay periodo activo.
- No hay grupos activos.
- No hay materias listas para asignar.

## 11) Navegacion y rutas

- ruta principal dashboard: `/usuario/dashboard`
- redireccion base: `/usuario` -> `/usuario/dashboard`
- item dedicado en sidebar para acceso directo.

## 12) Regla UX del encabezado

En pantalla de dashboard se minimiza ruido de contexto superior para priorizar informacion operativa (KPI + checklist + estado de borrador).

## 13) Dependencias con otros modulos

`dashboard` agrega estado de:

- `careers`
- `subjects`
- `groups`
- `teachers`
- `classrooms`
- `schedule_generator`

Por esto es la vista mas rapida para detectar datos faltantes antes de generar horarios.

## 14) Errores frecuentes

1. Dashboard sin datos pese a tener sesion:
- revisar universidad seleccionada en configuracion de usuario.

2. Conteo de grupos no esperado:
- revisar `uses_period_groups` y periodo activo.

3. `has_draft` en true sin borrador visible:
- revisar origen `draft_origin` (`user_configuration` vs `schedule_versions`).

4. Score bajo pese a tener datos cargados:
- revisar checklist `completion.items` para detectar modulo incompleto.

## 15) Checklist de QA

- [ ] Carga de dashboard con universidad seleccionada.
- [ ] Estado dashboard sin universidad seleccionada.
- [ ] Visualizacion de borrador activo.
- [ ] Conteos coherentes por modulo.
- [ ] Score de completitud consistente con checklist.
- [ ] Funcionamiento de accesos rapidos.
- [ ] Seccion de pasos visible en ambos estados (con/sin universidad).

## 16) Resumen ejecutivo

El dashboard es la capa de orquestacion operativa del usuario final.

Consolida salud de datos institucionales, estado de borradores y avance de prerequisitos para reducir errores antes de ejecutar la generacion de horarios.
