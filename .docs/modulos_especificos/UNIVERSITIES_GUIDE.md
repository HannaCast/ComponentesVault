# BACKEND - Modulo Universities (Universidades, Setup Completo y Logo)

## 1) Proposito de este documento

Explicar de forma integral el modulo `universities`:

- ciclo de vida de una universidad,
- setup atomico de configuracion academica,
- gestion de logo privado,
- y reglas que condicionan modulos dependientes (`groups`, `dashboard`, `schedule_generator`).

## 2) Alcance

Incluye:

- entidades `Universities`, `Images`, `Shifts`, `AcademicPeriods`,
- setup completo (`create`/`update`) con transaccion,
- endpoints de perfil y logo,
- reglas de negocio criticas (`uses_period_groups`, ventana horaria, turnos).

No incluye:

- UI de formularios en detalle visual,
- decisiones de despliegue de almacenamiento externo de imagenes.

## 3) Mapa funcional rapido

1. Usuario crea universidad base o setup completo.
2. Se configuran modalidades, turnos y periodos academicos.
3. `uses_period_groups` define politica de segmentacion para grupos.
4. Se puede subir/reemplazar/eliminar logo de forma segura.
5. Otros modulos consumen esta configuracion como fuente de verdad.

## 4) Ubicacion del modulo

Archivos clave:

- `horarios_backend/universities/models/universities.py`
- `horarios_backend/universities/models/images.py`
- `horarios_backend/universities/models/shifts.py`
- `horarios_backend/universities/models/academic_periods.py`
- `horarios_backend/universities/views/universities.py`
- `horarios_backend/universities/views/university_profile.py`
- `horarios_backend/universities/views/full_universities.py`
- `horarios_backend/universities/views/university_images.py`
- `horarios_backend/universities/services/full_setup_sync.py`
- `horarios_backend/universities/urls/universities.py`

## 5) Seguridad y contexto

Endpoints de escritura y recursos privados usan:

- `IsAuthenticated`
- aislamiento por usuario/propiedad de universidad en consultas

Implicacion:

- un usuario no puede manipular universidades de otro usuario,
- el logo se sirve por endpoint autenticado, no por ruta publica.

## 6) Entidades y campos relevantes

### 6.1 Universities

Campos de negocio:

- `name`, `short_name`, `institution_code`
- `start_time`, `end_time`
- `period_type`
- `uses_period_groups`
- `image`
- `status`, `is_deleted`

### 6.2 Images

Metadatos de archivo:

- nombre visible,
- mime,
- extension,
- hash,
- tamano,
- ruta interna en media,
- ciclo de vida (`is_deleted`).

### 6.3 Shifts

- turno por universidad,
- `order` para secuencia operativa,
- rango horario valido dentro de ventana institucional.

### 6.4 AcademicPeriods

- periodos academicos por universidad,
- control de `is_active` para flujos que dependen del periodo vigente.

## 7) Reglas de negocio clave

1. `uses_period_groups` se define en creacion y no debe mutar en edicion.
2. `start_time` debe ser menor a `end_time`.
3. Turnos deben quedar dentro de la ventana operativa institucional.
4. Setup completo debe ser atomico: si falla algo, no persiste parcial.
5. Logo:
- no expone ruta de almacenamiento real,
- reemplazos marcan imagen previa como eliminada logicamente.

## 8) Endpoints del modulo

### 8.1 Universidad principal

- `GET /api/v1/universities/`
- `POST /api/v1/universities/create/`
- `GET /api/v1/universities/{id}/`
- `PUT /api/v1/universities/{id}/`
- `DELETE /api/v1/universities/{id}/`

### 8.2 Perfil y setup

- `GET /api/v1/universities/{id}/profile/`
- `POST /api/setup/university-complete/`
- `PUT /api/v1/universities/{id}/full-setup/`

### 8.3 Logo

- `GET /api/v1/universities/{id}/image/`
- `POST /api/universities/{id}/upload-image/`
- `DELETE /api/universities/{id}/upload-image/`

## 9) Setup completo (alta)

Vista:

- `UniversityFullSetupView.post`

Flujo:

1. valida payload completo (`FullSetupSerializer`),
2. crea universidad base,
3. sincroniza modalidades, turnos y periodos,
4. confirma transaccion y responde `university_id`.

Ventaja:

- evita que frontend deba coordinar multiples requests dependientes.

## 10) Setup completo (edicion)

Vista:

- `UniversityFullSetupUpdateView.put`

Flujo:

1. valida payload de setup,
2. bloquea universidad objetivo (`select_for_update`),
3. actualiza entidad principal,
4. sincroniza recursos hijos,
5. responde setup consolidado.

## 11) Perfil de universidad

Vista:

- `UniversityProfileView.get`

Retorna en una sola respuesta:

- datos base de universidad,
- modalidades,
- turnos,
- periodos academicos,
- datos necesarios para rehidratar formulario de edicion.

## 12) Gestion de logo privado

Vistas:

- `UniversityImageByUniversityView.get`
- `UniversityUploadImageView.post`
- `UniversityUploadImageView.delete`

Comportamiento:

- el binario se entrega autenticado via backend,
- en reemplazo se marca imagen previa como `is_deleted=1`,
- en delete se limpia FK y se conserva trazabilidad de metadatos.

## 13) Dependencias con otros modulos

1. `groups`:
- depende de `uses_period_groups` para alcance por periodo activo.

2. `dashboard`:
- muestra contexto institucional y periodo activo basado en universidad seleccionada.

3. `schedule_generator`:
- usa configuracion institucional para restricciones y contexto de generacion.

4. `careers` y `classrooms`:
- consumen universidad como frontera de datos.

## 14) Errores frecuentes

1. Error de ventana horaria:
- `start_time >= end_time`.

2. Error en turnos:
- turno fuera de rango institucional,
- `start_time >= end_time` en el turno.

3. Error al cambiar `uses_period_groups` en edicion:
- cambio no permitido por consistencia historica.

4. `404` en logo:
- universidad inexistente/no accesible,
- imagen ausente o marcada como eliminada.

5. Error en setup:
- validacion en modalidad/turno/periodo invalido dentro de payload compuesto.

## 15) Ejemplo de setup completo

```json
{
  "university": {
    "name": "Universidad Emiliano Zapata",
    "short_name": "UTEZ",
    "institution_code": "UTEZ001",
    "start_time": "07:00",
    "end_time": "22:00",
    "period_type": 1,
    "uses_period_groups": 1
  },
  "modalities": [
    {
      "name": "Presencial",
      "require_classroom": 1,
      "configurations": {
        "allowed_days": [1, 2, 3, 4, 5],
        "classroom_days_per_week": 5
      }
    }
  ],
  "shifts": [
    { "name": "Matutino", "start_time": "07:00", "end_time": "14:00", "order": 1 }
  ],
  "academic_periods": [
    {
      "name": "Mayo - Agosto 2026",
      "start_date": "2026-05-01",
      "end_date": "2026-08-31",
      "year": 2026,
      "order": 1,
      "is_active": 1
    }
  ]
}
```

## 16) Checklist de QA

- [ ] Crear universidad simple y validar respuesta.
- [ ] Crear setup completo en una sola solicitud.
- [ ] Editar setup completo sin mutar `uses_period_groups`.
- [ ] Probar validaciones de turnos fuera de rango.
- [ ] Subir y reemplazar logo.
- [ ] Eliminar logo y verificar estado de imagen asociada.
- [ ] Verificar que otras vistas respeten universidad seleccionada.

## 17) Resumen ejecutivo

`universities` es el modulo raiz de configuracion institucional.

Define las reglas base del ecosistema academico (horarios, periodos, segmentacion por grupos) y su calidad de datos determina la estabilidad del resto de modulos operativos.
