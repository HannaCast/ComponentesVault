# FRONTEND - Guia de Implementacion de Modulos

> Documento orientado a implementacion real en este proyecto.
> Basado en la arquitectura actual de `horarios_frontend`, el backend existente y la documentacion de `.docs`.
> Ejemplo de referencia principal: modulo `subjects`.

---

## 1. Objetivo

Definir una forma clara, simple y consistente para construir modulos frontend que:

- Sean faciles de mantener.
- Respeten el contrato del backend.
- Eviten romper logica al agregar nuevas pantallas.
- Cumplan buenas practicas de calidad (incluyendo criterios comunes de Sonar).

---

## 2. Mapa de arquitectura frontend actual

Estructura base en `horarios_frontend/src`:

```text
src/
  core/         # infraestructura app (contexto, requests, rutas)
  shared/       # componentes y hooks reutilizables entre modulos
  modules/      # logica por dominio/feature
  App.jsx
  main.jsx
```

### 2.1 core

Responsabilidades:

- `core/context/`: estado global de sesion y tema.
  - `AuthContext.jsx`: login, logout, restoreSession, user actual.
  - `ThemeContext.jsx`: aplica tema/accent a nivel de document.
- `core/requests/`: clientes HTTP y reglas transversales.
  - `api.js`: endpoints publicos (login/register/refresh/my-config).
  - `apiToken.js`: endpoints protegidos + refresh automatico en 401.
  - `encryptionService.js`: cifrado para requests marcadas con `encrypt`.
- `core/routes/`: enrutamiento por rol y guardas.
  - `AppRouter.jsx`: rutas publicas + privadas.
  - `AdminRouter.jsx`, `UserRouter.jsx`: rutas por dominio de rol.

### 2.2 shared

Responsabilidades:

- `shared/components/`: componentes UI agnosticos de modulo.
  - inputs (`InputText`, `Select`, `Checkbox`, `ColorSwatchPicker`, etc.)
  - layout (`Header`, `Sidebar`, `SideDrawer`, `SurfacePanel`, etc.)
  - tablas/listado (`EntityListStateRenderer`, `EntityListItem`, `Pagination`)
  - modal (`ConfirmModal`)
- `shared/hooks/`: hooks reutilizables.
  - `useRequestDeduper.js`: evita requests duplicados muy cercanos.
- `shared/pages/`: pantallas transversales (`AppLoadingScreen`, `AppNotFoundScreen`).

### 2.3 modules

Responsabilidades:

- Cada dominio funcional vive en `modules`.
- Estado actual del repo:
  - `modules/auth/`: implementado (api, hooks, pages).
  - `modules/user/features/subjects/`: implementado completo y usado como patron base.
  - `modules/user/features/universities/`: implementado (setup completo, logo, modalidades, turnos y periodos).
  - `modules/user/features/careers/`: implementado.
  - `modules/user/features/groups/`: implementado.
  - `modules/user/features/teachers/`: implementado.
  - `modules/user/features/classrooms/`: implementado.
  - `modules/user/features/scheduleGenerator/`: implementado.
  - `modules/user/features/dashboard/` y `settings/`: implementados.

---

## 3. Relacion frontend-backend (contrato real)

Segun backend y `.docs`, el frontend debe asumir:

1. Todas las respuestas usan envelope estandar:

```json
{
  "error": false,
  "statusCode": 200,
  "message": "Operacion exitosa",
  "data": {},
  "meta": {}
}
```

2. Endpoints de listados grandes usan `paginated` con query params.

3. En modulos por universidad (como `subjects`, `careers`) la API filtra por universidad seleccionada del usuario.

4. `status` e `is_deleted` son conceptos de ciclo de vida backend:
- `status`: activo/inactivo.
- `is_deleted`: borrado logico (no visible en listados).

5. En `subjects`:
- GET select: `/api/v1/university/subjects/`
- GET paginado: `/api/v1/university/subjects/paginated/`
- CRUD detalle: `/api/v1/university/subjects/{id}/`
- Toggle status: `/api/v1/university/subjects/{id}/toggle-status/`
- Catalogo colores: `/api/v1/subjects/colors/`
- Catalogo carreras: `/api/v1/university/careers/`
- Catalogo profesores: `/api/v1/university/teachers/`

6. En `careers`, al abrir ver/editar se usa una sola llamada de detalle:
- `GET /api/v1/university/careers/{id}/`
- `data.period_exceptions` ya trae `id` y `career_id`, por lo que no se requiere una segunda consulta a `/api/v1/university/career-period-exceptions/`.

7. En `dashboard` (home del usuario) se consume un resumen consolidado por universidad:
- `GET /api/v1/university/dashboard/summary/`
- El frontend debe usar este endpoint como fuente unica para hero, cards KPI, estado de borrador y progreso de completitud.

---

## 4. Patron recomendado de modulo frontend

Para cada nuevo modulo de `modules/user/features/{modulo}` usar esta estructura:

```text
{modulo}/
  api/
    {modulo}Api.js
  hooks/
    use{Modulo}.js
  pages/
    {Modulo}Page.jsx
  components/
    {Modulo}Form.jsx
    {Modulo}Detail.jsx
  validations/
    {modulo}ValidationSchema.js
```

### 4.1 api/{modulo}Api.js

Responsabilidad:

- Solo definir llamadas HTTP.
- No guardar estado de UI aqui.
- Mantener funciones pequenas por endpoint.

Reglas:

- Usar `apiToken` para endpoints protegidos.
- Parametrizar query params de paginado/filtro.
- Mantener nombres claros: `getX`, `getXPaginated`, `createX`, `updateX`, `toggleXStatus`, `deleteX`.

### 4.2 hooks/use{Modulo}.js

Responsabilidad:

- Orquestar estado y operaciones de negocio del modulo.

Estado minimo recomendado:

- `itemsPage`, `totalItems`, `loading`, `error`.
- filtros (`searchTerm`, `estadoFiltro`, `ordenAscendente`).
- estado de formularios/detalle (`selectedItem`, `itemLoading`).

Reglas:

- Encapsular transformaciones de request/response.
- Exponer acciones limpias para la page.
- Mantener compatibilidad entre create/edit (payload consistente).

### 4.3 pages/{Modulo}Page.jsx

Responsabilidad:

- Componer la pantalla con componentes shared + hook del modulo.

Patron actual de `subjects`:

- Barra de filtros en `SurfacePanel`.
- Lista con `EntityListStateRenderer`.
- Item con `EntityListItem`.
- Acciones en `SideDrawer` para ver/editar/crear.
- Confirmaciones con `ConfirmModal`.
- toasts para feedback de usuario.

### 4.4 components/{Modulo}Form.jsx

Responsabilidad:

- Captura/edicion de datos.
- Validacion local antes de enviar.
- Normalizacion de payload para backend.

Reglas:

- Recibir `mode` (`create`, `edit`, `view`).
- Nunca mezclar request HTTP dentro del form (solo `onSubmit`).
- Cuidar conversiones de tipos (`string` UI -> `int` backend).

### 4.5 validations/{modulo}ValidationSchema.js

Responsabilidad:

- Esquema Yup centralizado por modulo.

Reglas:

- Mensajes de error claros para usuario.
- Reglas condicionales por `mode` cuando aplique.

### 4.6 Reglas implementadas en formulario de universidades

- Al crear universidad, la modalidad inicial por defecto es solo `Presencial`.
- Al agregar nuevas modalidades, se insertan al inicio de la lista (arriba), tanto en creacion como en edicion.
- Al agregar nuevos turnos, se insertan al inicio de la lista (arriba), tanto en creacion como en edicion.
- En los turnos, `start_time` y `end_time` se limitan en UI con `min/max` al rango operativo de la universidad (`start_time`/`end_time` de universidad).
- Ademas de la restriccion visual, el frontend valida que cada turno quede dentro del rango de apertura/cierre antes de enviar.

---

## 5. Flujo recomendado end-to-end (ejemplo subjects)

### 5.1 Carga de pantalla

1. Page monta.
2. Hook dispara `fetchSubjects` con filtros iniciales.
3. Se pinta estado loading -> data/empty/error.

### 5.2 Crear registro

1. Usuario abre drawer crear.
2. Page carga catalogos requeridos (colores/carreras/profesores).
3. Form valida localmente.
4. Form transforma payload a formato backend.
5. Hook llama `createSubject`.
6. Hook refresca lista paginada.
7. Page notifica y cierra drawer.

### 5.3 Editar registro

1. Usuario abre editar sobre item.
2. Hook consulta detalle por ID.
3. Form hidrata valores desde backend.
4. Submit con `updateSubject`.
5. Se refresca lista y se conserva coherencia visual.

### 5.4 Cambiar status

1. Usuario confirma toggle.
2. Hook llama endpoint `toggle-status`.
3. Lista se refresca.

### 5.5 Eliminar (soft delete)

1. Usuario confirma delete.
2. Hook llama DELETE.
3. Lista se refresca (el item ya no aparece por `is_deleted=0` en backend).

### 5.6 Dashboard (home de usuario)

1. Al entrar a `/usuario/dashboard`, la page dispara una sola carga de `dashboard/summary`.
2. El hook del modulo (`useDashboard`) concentra estados `loading/error/summary`.
3. El hero y cards se alimentan exclusivamente del payload resumen.
4. La alerta de borrador usa `schedule_generation.has_draft` y metadatos de version.
5. El panel de completitud usa `completion.score_percentage` + `completion.items`.
6. Los accesos rapidos se derivan del menu lateral y excluyen el item actual (`/usuario/dashboard`).

### 5.7 Generacion de horarios (scheduleGenerator)

1. El hook `useScheduleGenerator` expone `generateScheduleVersion()` que orquesta la llamada al backend.
2. Cuando el backend responde con error 422 y `data.teachers[]` (error `TEACHERS_WITHOUT_AVAILABILITY`),
   `generateScheduleVersion()` retorna `{ success: false, message, errorData: { teachers: [...] } }`.
3. La page detecta `result.errorData.teachers` y muestra un modal informativo con la lista de nombres
   (en lugar de un toast generico) para que el usuario sepa exactamente que profesores necesitan configurar disponibilidad.
4. El modal incluye un link directo a la seccion de Profesores usando `<Link>` de react-router-dom
   para mantener el comportamiento SPA.
5. Para otros errores de generacion (sin `teachers[]`), se mantiene el comportamiento previo: `toast.error`.

Patron de extraccion de errores estructurados en `useScheduleGenerator.js`:

- `extractApiError(err, fallback)` retorna `{ message, errorData }`.
- `errorData` es el campo `data` del cuerpo de error (puede ser `{ teachers: [...] }` u `null`).
- `extractApiErrorMessage(err, fallback)` es un wrapper de compatibilidad que solo retorna el texto.

---

## 6. Reglas de consistencia para nuevos modulos

## 6.1 Contrato de datos

- Definir una sola forma canonicamente usada en el hook.
- En forms, convertir tipos antes de enviar.
- Cuando backend acepta variantes (ej. `teachers`/`professors`), normalizar en un punto.

## 6.2 Separacion de responsabilidades

- `api`: solo HTTP.
- `hooks`: estado y negocio.
- `pages`: orquestacion de UI.
- `components`: UI modular.

## 6.3 UX y estados

- Siempre manejar loading, empty, error.
- Deshabilitar acciones durante operaciones de fila para evitar doble submit.
- Confirmar acciones destructivas.

## 6.4 Contexto de universidad

- Antes de mostrar modulo por universidad, validar `selected_university`.
- Si no hay universidad seleccionada, mostrar `SelectedUniversityAlert`.
- Para mostrar nombre de universidad en encabezados, usar `getSelectedUniversityDisplayName` (`@shared/utils/universityContext`) para mantener formato consistente: `Nombre completo (SHORT)` cuando ambos valores existen y son distintos.
- Mostrar `Periodo: ...` en el `contextLabel` solo en los modulos de **Grupos** y **Generacion de Horarios** cuando `user.selected_university_active_period_name` venga con valor.

## 6.5 Seguridad de sesion

- No guardar JWT en localStorage.
- Confiar en cookies HttpOnly + refresh automatico del interceptor.

## 6.6 Paleta user vs sistema en shared

Para evitar duplicar componentes de usuario/sistema, los componentes shared ahora usan una sola API de color:

- `colorVariant="user"` (default): usa variables `--accent`, `--accent-hover`, `--accent-subtle`.
- `colorVariant="default"`: usa variables de sistema `--system-*` declaradas en `src/index.css`.

Componentes ya alineados a este patron:

- `ActionButton`
- `InputText`
- `Select`
- `Textarea`
- `Checkbox`
- `SelectableListField`
- `CascadingSelectableListField` (flujo encadenado multi-select, ej. carrera -> periodo -> materia)

En `ActionButton` se mantiene compatibilidad y ademas se soporta atajo en `variant`:

- `variant="primary|secondary|outline"` para estilo de boton.
- `variant="user|default"` como atajo de boton primario con paleta indicada.

Ejemplos:

```jsx
<ActionButton label="Guardar" variant="primary" colorVariant="user" />
<ActionButton label="Comenzar" variant="primary" colorVariant="default" />

// Atajos equivalentes de boton primario
<ActionButton label="Guardar" variant="user" />
<ActionButton label="Comenzar" variant="default" />

<InputText label="Matricula" colorVariant="default" />
<Select label="Periodo" options={periods} colorVariant="default" />
```

---

## 7. Buenas practicas orientadas a Sonar

Aplicar desde el inicio del modulo:

1. Validar props con PropTypes en componentes reutilizables.
2. Evitar ternarios anidados largos; preferir funciones helper o if/else.
3. Evitar elementos no nativos para acciones clickeables; usar `button` para accesibilidad.
4. Evitar complejidad excesiva en pages grandes:
   - extraer funciones helper (`getDrawerTitle`, `getEmptyState`, etc.)
   - mover reglas de negocio al hook.
5. Evitar duplicacion de logica de parseo/normalizacion.
6. Mantener nombres explicitos en estado y handlers.

---

## 8. Plantilla de implementacion para un nuevo modulo

## Paso 1. Definir endpoints backend del modulo

- Confirmar con `.docs/BACKEND_ENDPOINTS_POR_REALIZAR.md`.
- Confirmar shape de `data` en list/detail/create/update.

## Paso 2. Crear capa API

- Archivo `api/{modulo}Api.js` con funciones CRUD + paginado + catalogos.

## Paso 3. Crear hook del modulo

- Estado de lista, filtros, seleccion, loading/error.
- Funciones de fetch y mutaciones.

## Paso 4. Crear validaciones

- `validations/{modulo}ValidationSchema.js`.

## Paso 5. Crear Form y Detail

- Inputs con componentes shared.
- Transformacion de payload antes de submit.

## Paso 6. Crear Page

- filtros + listado + drawer + modales confirmacion.

## Paso 7. Registrar ruta

- En `core/routes/UserRouter.jsx` o `AdminRouter.jsx` segun corresponda.

## Paso 8. Validar

- Revisar errores editor.
- Ejecutar build frontend.
- Verificar flujos create/edit/toggle/delete manualmente.

---

## 9. Checklist de Definition of Done por modulo

- [ ] API del modulo creada y alineada a backend.
- [ ] Hook con estado completo y manejo de errores.
- [ ] Page conectada con filtros/lista/paginacion.
- [ ] Form con validacion y payload correcto.
- [ ] Detail en modo lectura.
- [ ] ConfirmModal para acciones sensibles.
- [ ] Ruta registrada por rol.
- [ ] Build frontend exitoso.
- [ ] Sin errores de lint/sintaxis.
- [ ] Sin regresiones en flujo de edicion.

---

## 10. Nota final

Si se mantiene este patron, el frontend puede crecer por modulos (careers, groups, teachers, classrooms, universities) de forma predecible, con bajo acoplamiento y con una curva de mantenimiento mucho menor.

`subjects` ya funciona como blueprint real para implementar los siguientes modulos.