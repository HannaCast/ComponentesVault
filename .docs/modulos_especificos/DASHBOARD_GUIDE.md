# DASHBOARD GUIDE

## Objetivo

Centralizar en una sola pantalla el estado operativo de la universidad seleccionada para acelerar la toma de decisiones antes de generar/confirmar horarios.

---

## Backend

### Endpoint principal

- `GET /api/v1/university/dashboard/summary/`
- Requiere autenticacion + universidad seleccionada (`RequireSelectedUniversity`).

### Datos que entrega

- `university`
  - `id`, `name`, `short_name`
  - `uses_period_groups`
  - `active_period_name`
- `schedule_generation`
  - `has_draft`
  - `draft_version_id`
  - `draft_version_label`
  - `draft_created_at`
  - `draft_origin` (`schedule_versions` o `user_configuration`)
- `counts`
  - `careers`: `total`, `active`
  - `subjects`: `total`, `active`
  - `groups`: `total`, `active`, `scoped_to_active_period`
  - `teachers`: `total`, `active`, `with_availability`, `without_availability`
  - `classrooms`: `total`, `active`
- `completion`
  - `score_percentage`
  - `completed_modules`
  - `total_modules`
  - `items[]` (checklist de completitud)

### Criterios de conteo

- Solo registros no eliminados logicamente (`is_deleted = 0`).
- `groups` se acota al periodo activo cuando la universidad usa periodos por grupo (`uses_period_groups = 1`).
- Disponibilidad de profesores considera al menos un bloque con `is_available = 1`.

---

## Frontend

### Estructura del modulo

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

### Flujo de carga

1. `UserHomePage` solicita `dashboard/summary` al montar (en contexto de universidad seleccionada).
2. `useDashboard` maneja estado de carga, errores y cache en memoria de la pagina.
3. La UI se compone con componentes especializados:
   - Hero con universidad + periodo activo + score.
   - Tarjetas KPI por modulo.
   - Alerta de borrador pendiente.
   - Panel de completitud.
   - Accesos rapidos (derivados de sidebar, excluyendo Dashboard).
   - Seccion `Pasos para generar horarios` debajo de Accesos rapidos.

### Seccion de pasos para generar horarios

La seccion presenta, en lenguaje de usuario, una guia rapida para preparar y generar horarios:

1. Seleccionar universidad y periodo activo.
2. Configurar base academica (carreras, materias, grupos activos).
3. Completar profesores/disponibilidad y aulas.
4. Generar o actualizar borrador en el modulo de generacion.
5. Revisar resultado y confirmar version final.

Tambien muestra mensajes frecuentes que impiden generar el horario:

- No hay universidad seleccionada.
- No hay periodo activo.
- No hay grupos activos.
- No hay materias listas para asignar.

### Navegacion

- Ruta explicita: `/usuario/dashboard`.
- Redireccion base: `/usuario` -> `/usuario/dashboard`.
- Sidebar: item `Dashboard` agregado al menu principal.

### Comportamiento sin universidad seleccionada

- El dashboard ahora es accesible aun sin universidad seleccionada.
- En ese estado no se consulta `dashboard/summary`.
- Se muestran:
  - Hero en estado neutro.
  - Alerta para seleccionar universidad.
  - Accesos rapidos.
  - Seccion `Pasos para generar horarios`.

### Nota UX

- En dashboard se oculta el resumen superior de sesion (`Usuario Normal` / universidad) para reducir ruido visual y priorizar KPIs.
