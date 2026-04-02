# Sistema de Generacion de Horarios Academicos

## Descripcion general

El sistema genera horarios academicos en funcion de la estructura organizacional de cada universidad, considerando carreras, materias, profesores, aulas, periodos academicos y configuraciones especificas.

---

## Usuarios y roles

Existen las tablas `users` y `roles`, ambas parte de la gestion de acceso:

- `users`: almacena nombre, correo, contrasena, estado y ultimo acceso.
- `roles`: define tipos de usuario (administrador, coordinador, etc.).

Cada usuario tiene un rol asignado, el cual determina sus permisos.

> La tabla `roles` es un catalogo de solo lectura: solo permite operaciones `GET`.

---

## Configuracion de usuario y contexto

La tabla `user_configurations` contiene `selected_university_id`, que indica la universidad activa del usuario.

A partir de ese campo:

- Todos los listados paginados deben devolver informacion de la universidad seleccionada.
- Todas las creaciones deben asociarse automaticamente a esa universidad.

Ejemplo: al crear una carrera, queda ligada a la universidad seleccionada.

---

## Universidades

La tabla `universities` es la entidad principal del sistema y define el contexto general de generacion.

Tambien se relaciona con `images`, donde se almacenan metadatos y archivos como:

- Logotipo institucional.
- Imagen representativa.

Campos relevantes en `universities`:

- `start_time` y `end_time`: horario de operacion.
- `period_type_id`: tipo de periodo (semestre, cuatrimestre, trimestre).
- `uses_period_groups`: determina la logica de relacion entre grupos y periodos academicos.

### Relacion entre grupos y periodos

#### Cuando `uses_period_groups = false`

- Los grupos no se ligan a un periodo academico especifico.
- Se manejan de forma generica (ejemplo: "3A").
- La generacion de horarios no considera periodos academicos.

#### Cuando `uses_period_groups = true`

- Los grupos se relacionan con un periodo academico.
- Se obtiene una estructura mas controlada para generar horarios.
- El campo `academic_periods.is_active` indica el periodo vigente.

---

## Imagenes y colores

- `images`: almacena archivos y metadatos de imagenes.
- `colors`: define colores para representacion visual de materias en los horarios.

---

## Materias

La tabla `subjects` contiene las materias ofertadas por la universidad e incluye:

- Nombre.
- Codigo.
- Horas por semana.
- Color.
- Indicador de obligatoriedad.

---

## Periodos academicos

### `academic_periods`

Define periodos academicos por universidad, con campos como:

- Nombre (ejemplo: "Mayo - Agosto").
- Orden dentro del anio.
- Anio (cuando aplica).
- `is_active` para identificar el periodo actual.

### `period_types`

Catalogo de tipos de periodo:

- Semestre.
- Cuatrimestre.
- Trimestre.

---

## Carreras

### `careers`

Define las carreras ofertadas por universidad.

Incluye:

- Nombre.
- Total de periodos.
- Relacion con universidad.

### Tablas relacionadas

- `career_subjects`: relaciona materias con carreras y su periodo de imparticion.
- `career_period_exceptions`: define periodos sin generacion de horarios (ejemplo: estadias).

---

## Grupos

La tabla `groups` representa grupos academicos e incluye:

- Nombre (ejemplo: "3A").
- Carrera.
- Periodo.
- Turno.
- Periodo academico (cuando aplica).
- Universidad.

---

## Profesores

La tabla `teachers` contiene informacion de profesores.

Campo relevante:

- `require_classroom`: indica si el profesor requiere aula para impartir clases.

Este campo se considera en la generacion de horarios. Por ejemplo, en modalidad en linea, un profesor puede requerir aula si no cuenta con espacio adecuado.

### Otras tablas relacionadas

- `teacher_availabilities`: disponibilidad por dia y horario.
- `teachers_subjects`: relacion profesor-materia.
- `teachers_universities`: relacion profesor-universidad.

---

## Turnos

La tabla `shifts` define turnos por universidad, por ejemplo:

- Matutino.
- Vespertino.
- Mixto.

Incluye horario de inicio y fin.

---

## Aulas

### `classroom_types`

Define tipos de aula:

- Salon.
- Laboratorio.
- Compuaula.

### `classrooms`

Define espacios fisicos e incluye:

- Nombre.
- Codigo.
- Piso.
- Edificio.
- Indicador `is_restricted`.

### `classroom_careers`

Cuando `is_restricted = true`, esta tabla indica a que carreras pertenece el aula.

---

## Modalidades

La tabla `modalities` define como se imparten clases:

- Presencial.
- En linea.
- Mixta.
- Fines de semana.

Puede incluir configuracion JSON, por ejemplo:

```json
{
  "allowed_days": [1, 2, 3, 4, 5],
  "classroom_days_per_week": 5
}
```

- `allowed_days`: dias habilitados para impartir la modalidad.
- `classroom_days_per_week`: cantidad de dias que requieren aula.

---

## Auditoria

La auditoria usa un enfoque mixto (BD + backend):

- Triggers MySQL registran operaciones exitosas sobre tablas de negocio.
- El backend setea variables de sesion (`@app_user_id`, `@app_username`, `@app_ip`, `@app_user_agent`, `@app_transaction_id`, `@app_action`).
- Para acciones especiales (por ejemplo cambio de estado) se usa `CHANGE_STATUS` de forma acotada.
- Cuando hay error de aplicacion en endpoints decorados, el backend inserta un log con `is_succesfull = 0` y `error_message`.

Valores comunes de `action`:

- `CREATE`, `UPDATE`, `DELETE` (flujo BD)
- `INSERT`, `CHANGE_STATUS` (flujo app)

Campos clave registrados:

- `old_data`, `new_data`
- `user_id`, `username`, `source`
- `ip_address`, `user_agent`
- `transaction_id`, `is_succesfull`, `error_message`

Detalle tecnico:

- `.docs/modulos_especificos/BACKEND_AUDITORIA.md`

---

## Consideraciones finales

Las tablas marcadas en color naranja son catalogos o entidades de cambio infrecuente.

Regla general:

- Por defecto, solo requieren `GET`.
- De forma opcional, pueden permitir CRUD solo para rol administrador.
- Excepcion: `roles`, que no debe modificarse bajo ninguna circunstancia.

---

## Explicacion formal

El sistema es de generacion de horarios academicos.

Existen las tablas `users` y `roles`, las cuales forman parte de la gestion de acceso al sistema. La tabla `users` almacena la informacion de los usuarios que pueden ingresar, como su nombre, correo, contrasena, estado y la fecha de su ultimo acceso. Por su parte, la tabla `roles` define los distintos tipos de usuario dentro del sistema (por ejemplo, administrador, coordinador, etc.), y cada usuario tiene asignado un rol que determina sus permisos y acciones disponibles. Cabe destacar que la tabla `roles` es un catalogo que no debe modificarse, por lo que unicamente requiere consultas.

Ademas, hay una relacion entre `users` y `universities` a traves de la tabla `user_configurations`.

La tabla `user_configurations` contiene un campo llamado `selected_university_id`, que indica la universidad seleccionada por el usuario. A partir de este valor, el sistema determina el contexto de trabajo, es decir, todas las operaciones como la creacion de modalidades, carreras, aulas, profesores y demas informacion se realizaran en funcion de la universidad seleccionada. Esto implica que todos los listados (paginados) siempre traeran informacion correspondiente a dicha universidad, y que todas las nuevas creaciones quedaran asociadas a ella; por ejemplo, al crear una carrera, esta pertenecera automaticamente a la universidad seleccionada.

La tabla `universities` es la entidad principal del sistema, donde se almacenan los datos de cada universidad. Esta tabla se relaciona con la tabla `images`, la cual guarda los metadatos y archivos de las imagenes, como el logotipo institucional y la imagen representativa de la universidad.

Dentro de `universities`, existe un campo importante llamado `uses_period_groups`. Este campo define el comportamiento del sistema respecto a la relacion entre los grupos y los periodos academicos.

Cuando `uses_period_groups` es falso, los grupos no estan asociados a un periodo academico especifico. En este caso, un grupo como "tercero A" se maneja de forma generica, sin pertenecer a un periodo en particular, y los horarios se generan sin considerar periodos academicos.

Por otro lado, cuando `uses_period_groups` es verdadero, los grupos si estan relacionados con un periodo academico. Esto permite que el usuario defina grupos vinculados directamente a un periodo especifico, lo que da una estructura mas precisa para la generacion de horarios. En este escenario, el campo `is_active` de la tabla `academic_periods` indica cual es el periodo academico que se encuentra en curso dentro de la universidad.

El sistema tambien cuenta con la tabla `images`, que almacena la informacion de las imagenes utilizadas, y la tabla `colors`, que define colores representativos que pueden utilizarse para identificar visualmente las materias dentro de los horarios.

La tabla `subjects` contiene las materias que ofrece la universidad, incluyendo informacion como nombre, codigo, horas por semana y si son obligatorias.

Los periodos academicos se manejan mediante la tabla `academic_periods`, donde se definen elementos como el nombre del periodo (por ejemplo, "Mayo - Agosto"), su orden dentro del anio y el anio correspondiente. Cuando los grupos estan relacionados con periodos, el campo `is_active` indica cual es el periodo vigente en el que se esta trabajando.

Ademas, existe la tabla `period_types`, que define los tipos de periodos academicos, como semestre, cuatrimestre o trimestre.

Las carreras se gestionan mediante la tabla `careers`, donde se especifica el nombre de la carrera, su duracion en numero de periodos y su relacion con la universidad. La tabla `career_subjects` permite asociar las materias a cada carrera indicando en que periodo se imparten, mientras que `career_period_exceptions` define aquellos periodos en los que no se generan horarios, como en el caso de estadias.

Los grupos se almacenan en la tabla `groups`, donde se define su nombre, la carrera a la que pertenecen, el periodo, el turno y, en caso de aplicar, el periodo academico al que estan asociados.

En cuanto a los profesores, la tabla `teachers` contiene su informacion basica, incluyendo si requieren un aula para impartir clases, ya que este aspecto se toma en cuenta durante la generacion de horarios. Por ejemplo, en modalidades en linea, si un profesor no cuenta con un espacio adecuado como una oficina para impartir su clase, entonces requerira un aula. La disponibilidad de los profesores se gestiona en la tabla `teacher_availabilities`, donde se especifican los dias y horarios en los que estan disponibles. La relacion entre profesores y materias se maneja en `teachers_subjects`, y su relacion con las universidades en `teachers_universities`.

Los turnos se definen en la tabla `shifts`, donde se establecen opciones como matutino, vespertino o mixto, junto con sus horarios correspondientes.

Las aulas se gestionan mediante varias tablas. `classroom_types` define los tipos de aula, como salon, laboratorio o compuaula. `classrooms` contiene la informacion de los espacios fisicos, incluyendo nombre, codigo, ubicacion y si son restringidos. Cuando un aula es restringida, la tabla `classroom_careers` indica a que carreras pertenece exclusivamente.

Las modalidades se almacenan en la tabla `modalities`, donde se definen tipos como presencial, en linea, mixta o fines de semana. Estas pueden incluir configuraciones adicionales en formato JSON, como los dias permitidos para clases y la cantidad de dias que requieren el uso de un aula.

El sistema tambien incluye una tabla de auditoria llamada `audit_logs`, la cual registra tanto operaciones exitosas (via triggers) como errores de aplicacion (via backend), incorporando informacion de usuario, IP, user-agent, accion, transaccion y mensaje de error cuando aplica.

Finalmente, es importante considerar que las tablas marcadas en color naranja corresponden a catalogos o entidades cuya informacion rara vez cambia. Por ello, en la mayoria de los casos solo requieren operaciones de consulta (`GET`). De manera opcional, pueden permitir operaciones de creacion, actualizacion o eliminacion, pero unicamente para usuarios con rol de administrador. La unica excepcion es la tabla `roles`, la cual no debe modificarse bajo ninguna circunstancia.
