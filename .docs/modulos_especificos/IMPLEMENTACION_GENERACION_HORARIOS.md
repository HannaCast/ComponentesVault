# Planificación: Módulo de Generación Automática de Horarios
### Stack: Python 3.11+ · Django · Django REST Framework

> **Propósito de este documento:** Instrucciones técnicas completas para que un agente de IA
> implemente el módulo de generación de horarios académicos sobre la base de datos `cdi_horarios`,
> usando coloreo de grafos (DSatur). **No se genera ninguna tabla nueva de persistencia** en esta fase.

---

## 1. Contexto y alcance

### 1.1 ¿Qué hace este módulo?

Dado el contexto de una universidad (determinado por `user_configurations.selected_university_id`),
el módulo recorre todos los **grupos activos** del periodo vigente y produce, para cada uno,
una **propuesta de horario semanal** que respeta:

- Disponibilidad de profesores (`teacher_availabilities`)
- Horas semanales por materia (`subjects.hours_per_week`)
- Restricciones de aulas (`classroom_careers`, `classrooms.is_restricted`)
- Días y modalidad de la carrera (`modalities.configurations`)
- Turno del grupo (`shifts.start_time / end_time`)
- Periodos sin horario (`career_period_exceptions`)

El resultado es un dict/JSON estructurado. **No se persiste en base de datos** en esta fase.

### 1.2 Restricciones duras (Hard Constraints)

Las siguientes restricciones NO pueden violarse:

| ID    | Restricción |
|-------|-------------|
| HC-01 | Un grupo no puede tener dos clases al mismo tiempo |
| HC-02 | Un profesor no puede estar en dos lugares al mismo tiempo |
| HC-03 | Un aula no puede tener dos clases al mismo tiempo |
| HC-04 | Una clase no puede asignarse fuera de la disponibilidad del profesor |
| HC-05 | Una clase no puede asignarse fuera del turno del grupo |
| HC-06 | Una clase no puede asignarse en un día no permitido por la modalidad |
| HC-07 | No se genera horario para periodos en `career_period_exceptions` |
| HC-08 | Un aula restringida solo puede usarse por las carreras en `classroom_careers` |
| HC-09 | Si `modalities.require_classroom = 0`, no se asigna aula al slot |
| HC-10 | Si `teachers.require_classroom = 1`, se le debe asignar aula incluso en modalidad online |

### 1.3 Restricciones blandas (Soft Constraints)

| ID    | Preferencia |
|-------|-------------|
| SC-01 | No dejar huecos de más de 1 hora libre entre clases del mismo grupo en un día |
| SC-02 | Distribuir las horas de una materia en días distintos (no todas el mismo día) |
| SC-03 | Respetar el orden natural: materias de periodos más bajos en horarios tempranos |

---

## 2. Algoritmo central: DSatur adaptado

### 2.1 Definición del grafo

```
Nodo  = (group_id, career_subject_id, teacher_id)
        → representa "una clase que hay que asignar"

Color = (day_of_week, start_time, end_time, classroom_id | None)
        → representa un slot de tiempo + aula

Arista = conflicto entre dos nodos (no pueden compartir el mismo color)
```

### 2.2 Cuándo existe arista entre nodo A y nodo B

```
arista(A, B) si:
  A.group_id   == B.group_id    → mismo grupo          (HC-01)
  A.teacher_id == B.teacher_id  → mismo profesor       (HC-02)
  A.classroom  == B.classroom   → misma aula (al asignar, no precalculado) (HC-03)
```

### 2.3 Expansión de nodos por horas semanales

Una materia con `hours_per_week = 4` genera **4 nodos independientes** del mismo
`(group_id, career_subject_id, teacher_id)`. Cada nodo necesita su propio slot.
Se agregan aristas entre los 4 nodos entre sí, y entre ellos y todos los demás nodos del grupo.
Para cumplir SC-02, se penaliza en el scoring asignar dos nodos del mismo bloque al mismo día.

### 2.4 Pasos del algoritmo DSatur

```
1. Construir lista de nodos
2. Para cada nodo, calcular su lista de colores válidos (slots disponibles)
3. Ordenar colores válidos de cada nodo por score (soft constraints)
4. Ordenar nodos por saturación DESC, luego grado DESC
5. Tomar el nodo con mayor saturación
6. Intentar asignar el color válido de menor score que no viole hard constraints
7. Si requiere aula: buscar aula disponible para ese slot
8. Si se asignó: actualizar saturación de vecinos y reordenar
9. Si no se asignó: marcar como NO_ASIGNADO y continuar
10. Repetir hasta procesar todos los nodos
```

---

## 3. Estructura de carpetas (Django app)

```
schedule_generator/              ← Django app (python manage.py startapp schedule_generator)
├── __init__.py
├── apps.py
├── urls.py                      ← rutas del módulo
├── views.py                     ← APIView principal
│
├── loaders/                     ← carga de datos desde BD vía ORM
│   ├── __init__.py
│   ├── university_context.py
│   ├── groups_loader.py
│   ├── subjects_loader.py
│   ├── teachers_loader.py
│   ├── classrooms_loader.py
│   └── slots_builder.py
│
├── graph/                       ← construcción y coloreo del grafo
│   ├── __init__.py
│   ├── models.py                ← dataclasses (no son modelos Django)
│   ├── node_builder.py
│   ├── edge_builder.py
│   ├── schedule_graph.py
│   └── dsatur.py
│
├── constraints/                 ← evaluadores de restricciones
│   ├── __init__.py
│   ├── hard_constraints.py
│   └── soft_constraints.py
│
├── formatter/                   ← convierte grafo resuelto a dict de salida
│   ├── __init__.py
│   └── schedule_formatter.py
│
└── services.py                  ← orquestador principal, llamado desde la view
```

Registrar la app en `settings.py`:
```python
INSTALLED_APPS = [
    ...
    'schedule_generator',
]
```

---

## 4. Dataclasses (`graph/models.py`)

> Usar `@dataclass` de Python. **No son modelos Django** (no heredan de `models.Model`).
> No se migran ni se crean tablas para ellos.

```python
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import time
from typing import Optional


@dataclass
class TimeSlot:
    slot_id: str          # "MON_0700_0800"
    day_of_week: int      # 1=Lunes … 7=Domingo
    start_time: time
    end_time: time


@dataclass
class ClassroomCandidate:
    classroom_id: int
    name: str
    classroom_type_id: int
    is_restricted: bool
    allowed_career_ids: list[int]


@dataclass
class ScheduleColor:
    slot: TimeSlot
    classroom: Optional[ClassroomCandidate]


@dataclass
class TeacherAvailabilityBlock:
    day_of_week: int
    start: time
    end: time
    is_available: bool


@dataclass
class TeacherContext:
    teacher_id: int
    full_name: str
    require_classroom: bool
    availability: list[TeacherAvailabilityBlock]


@dataclass
class SubjectContext:
    career_subject_id: int
    subject_id: int
    subject_name: str
    hours_per_week: int
    color_hex: str
    contrast_hex: str


@dataclass
class GroupContext:
    group_id: int
    group_name: str
    career_id: int
    period_number: int
    shift_start: time
    shift_end: time
    modality_require_classroom: bool
    allowed_days: list[int]
    classroom_days_per_week: int


@dataclass
class ScheduleNode:
    node_id: str                     # uuid4
    group_id: int
    career_id: int
    career_subject_id: int
    subject_id: int
    subject_name: str
    teacher_id: int                  # -1 si no hay profesor
    block_index: int                 # 0..N-1 cuando hours_per_week > 1
    requires_classroom: bool
    valid_colors: list[ScheduleColor]
    assigned_color: Optional[ScheduleColor] = None
    saturation: int = 0


@dataclass
class ScheduleEntry:
    day_of_week: int
    start_time: str
    end_time: str
    subject_id: int
    subject_name: str
    subject_color: str
    subject_contrast_color: str
    teacher_id: int
    teacher_full_name: str
    classroom_id: Optional[int]
    classroom_name: Optional[str]


@dataclass
class UnassignedEntry:
    subject_id: int
    subject_name: str
    reason: str


@dataclass
class GroupSchedule:
    group_id: int
    group_name: str
    career_id: int
    period_number: int
    entries: list[ScheduleEntry]
    unassigned: list[UnassignedEntry]


@dataclass
class GenerationSummary:
    total_groups: int
    total_nodes_attempted: int
    total_nodes_assigned: int
    total_nodes_unassigned: int
    unassigned_detail: list[dict]


@dataclass
class GenerationResult:
    university_id: int
    generated_at: str
    group_schedules: list[GroupSchedule]
    summary: GenerationSummary
```

---

## 5. Cargadores de datos (`loaders/`)

> Todos usan el ORM de Django con `.values()` y `select_related` / `prefetch_related`
> para evitar N+1 queries. **No usar SQL crudo** salvo que el ORM no permita la consulta.

### 5.1 `loaders/university_context.py`

```python
from django.db.models import F


def load_university_context(university_id: int) -> dict:
    """
    Retorna:
        {
            "university_id": int,
            "start_time": time,
            "end_time": time,
            "uses_period_groups": bool,
            "active_period_id": int | None,
        }

    Raises ValueError si la universidad no existe o está inactiva.
    """
    from core.models import University, AcademicPeriod  # ajustar import según proyecto

    university = (
        University.objects
        .select_related("period_type")
        .filter(id=university_id, status=1, is_deleted=0)
        .first()
    )
    if not university:
        raise ValueError(f"Universidad {university_id} no encontrada o inactiva.")

    active_period = (
        AcademicPeriod.objects
        .filter(university_id=university_id, is_active=1, is_deleted=0)
        .values_list("id", flat=True)
        .first()
    )

    return {
        "university_id": university_id,
        "start_time": university.start_time,
        "end_time": university.end_time,
        "uses_period_groups": bool(university.uses_period_groups),
        "active_period_id": active_period,
    }
```

---

### 5.2 `loaders/groups_loader.py`

```python
import json
from graph.models import GroupContext


def load_active_groups(
    university_id: int,
    active_period_id: int | None,
    uses_period_groups: bool,
) -> list[GroupContext]:
    """
    Carga grupos activos de la universidad, excluyendo:
    - Grupos con is_deleted=1 o status=0
    - Grupos cuyo (career_id, period_number) esté en career_period_exceptions

    Si uses_period_groups=True, filtra por academic_period_id=active_period_id.
    """
    from core.models import Group  # ajustar import

    qs = (
        Group.objects
        .select_related("shift", "career", "career__modality")
        .filter(university_id=university_id, status=1, is_deleted=0)
    )

    if uses_period_groups:
        if active_period_id is None:
            raise ValueError("uses_period_groups=True pero no hay periodo académico activo.")
        qs = qs.filter(academic_period_id=active_period_id)

    # Excluir periodos sin horario (career_period_exceptions)
    from core.models import CareerPeriodException
    exceptions = set(
        CareerPeriodException.objects
        .filter(status=1, is_deleted=0)
        .values_list("career_id", "period_number")
    )

    result = []
    for g in qs:
        if (g.career_id, g.period_number) in exceptions:
            continue

        modality = g.career.modality
        config = modality.configurations or {}
        if isinstance(config, str):
            config = json.loads(config)

        result.append(GroupContext(
            group_id=g.id,
            group_name=g.name,
            career_id=g.career_id,
            period_number=g.period_number,
            shift_start=g.shift.start_time,
            shift_end=g.shift.end_time,
            modality_require_classroom=bool(modality.require_classroom),
            allowed_days=config.get("allowed_days", [1, 2, 3, 4, 5]),
            classroom_days_per_week=config.get("classroom_days_per_week", 5),
        ))

    return result
```

---

### 5.3 `loaders/subjects_loader.py`

```python
from graph.models import SubjectContext


def load_subjects_for_group(career_id: int, period_number: int) -> list[SubjectContext]:
    """
    Retorna las materias asignadas a una carrera en un período específico.
    """
    from core.models import CareerSubject  # ajustar import

    rows = (
        CareerSubject.objects
        .select_related("subject", "subject__color")
        .filter(
            careers_id=career_id,
            period_number=period_number,
            is_deleted=0,
            subject__status=1,
            subject__is_deleted=0,
        )
    )

    result = []
    for cs in rows:
        s = cs.subject
        color = s.color
        result.append(SubjectContext(
            career_subject_id=cs.id,
            subject_id=s.id,
            subject_name=s.name,
            hours_per_week=s.hours_per_week,
            color_hex=color.hex if color else "3B82F6",
            contrast_hex=color.contrast_hex if color else "FFFFFF",
        ))

    return result
```

---

### 5.4 `loaders/teachers_loader.py`

```python
from collections import defaultdict
from graph.models import TeacherContext, TeacherAvailabilityBlock


def load_teachers_for_subject(subject_id: int, university_id: int) -> list[TeacherContext]:
    """
    Retorna profesores que pueden impartir la materia en esta universidad,
    junto con su disponibilidad semanal completa.
    """
    from core.models import TeacherSubject, TeacherAvailability  # ajustar import

    teacher_ids = list(
        TeacherSubject.objects
        .filter(subjects_id=subject_id, is_deleted=0)
        .select_related("teacher")
        .filter(
            teacher__status=1,
            teacher__is_deleted=0,
            teacher__teachers_universities__universities_id=university_id,
            teacher__teachers_universities__status=1,
        )
        .values_list("teachers_id", flat=True)
        .distinct()
    )

    if not teacher_ids:
        return []

    # Cargar disponibilidades en una sola query
    availabilities = (
        TeacherAvailability.objects
        .filter(teacher_id__in=teacher_ids, is_deleted=0)
        .values("teacher_id", "day_of_week", "start_time", "end_time", "is_available")
    )

    avail_map: dict[int, list[TeacherAvailabilityBlock]] = defaultdict(list)
    for row in availabilities:
        avail_map[row["teacher_id"]].append(
            TeacherAvailabilityBlock(
                day_of_week=row["day_of_week"],
                start=row["start_time"],
                end=row["end_time"],
                is_available=bool(row["is_available"]),
            )
        )

    from core.models import Teacher
    teachers = Teacher.objects.filter(id__in=teacher_ids)

    result = []
    for t in teachers:
        result.append(TeacherContext(
            teacher_id=t.id,
            full_name=f"{t.name} {t.surname} {t.last_name or ''}".strip(),
            require_classroom=bool(t.require_classroom),
            availability=avail_map.get(t.id, []),
        ))

    return result
```

---

### 5.5 `loaders/classrooms_loader.py`

```python
from collections import defaultdict
from graph.models import ClassroomCandidate


def load_classrooms_for_university(university_id: int) -> list[ClassroomCandidate]:
    """
    Carga todos los salones activos de la universidad.
    Para los restringidos, incluye a qué carreras pertenecen.
    """
    from core.models import Classroom, ClassroomCareer  # ajustar import

    classrooms = (
        Classroom.objects
        .filter(universities_id=university_id, status=1, is_deleted=0)
        .values("id", "name", "classroom_type_id", "is_restricted")
    )

    classroom_ids = [c["id"] for c in classrooms]

    career_map: dict[int, list[int]] = defaultdict(list)
    for row in ClassroomCareer.objects.filter(classrooms_id__in=classroom_ids, is_deleted=0):
        career_map[row.classrooms_id].append(row.careers_id)

    result = []
    for c in classrooms:
        result.append(ClassroomCandidate(
            classroom_id=c["id"],
            name=c["name"],
            classroom_type_id=c["classroom_type_id"],
            is_restricted=bool(c["is_restricted"]),
            allowed_career_ids=career_map.get(c["id"], []),
        ))

    return result
```

---

### 5.6 `loaders/slots_builder.py`

```python
from datetime import time, datetime, timedelta
from graph.models import TimeSlot


def build_time_slots(
    shift_start: time,
    shift_end: time,
    allowed_days: list[int],
    slot_duration_minutes: int = 60,
) -> list[TimeSlot]:
    """
    Genera la grilla de slots posibles para un grupo.

    Args:
        shift_start: hora de inicio del turno (ej: time(7, 0))
        shift_end:   hora de fin del turno   (ej: time(13, 0))
        allowed_days: días permitidos por la modalidad (1=Lun .. 7=Dom)
        slot_duration_minutes: duración de cada bloque (default 60)

    Returns:
        Lista de TimeSlot ordenada por día y hora.
    """
    slots: list[TimeSlot] = []
    delta = timedelta(minutes=slot_duration_minutes)

    for day in sorted(allowed_days):
        current = datetime.combine(datetime.today(), shift_start)
        end_dt = datetime.combine(datetime.today(), shift_end)

        while current + delta <= end_dt:
            start = current.time()
            end = (current + delta).time()
            slot_id = f"D{day}_{start.strftime('%H%M')}_{end.strftime('%H%M')}"

            slots.append(TimeSlot(
                slot_id=slot_id,
                day_of_week=day,
                start_time=start,
                end_time=end,
            ))
            current += delta

    return slots
```

---

## 6. Construcción del grafo (`graph/`)

### 6.1 `graph/node_builder.py`

```python
import uuid
from graph.models import (
    GroupContext, SubjectContext, TeacherContext,
    ClassroomCandidate, TimeSlot, ScheduleColor, ScheduleNode,
)
from constraints.hard_constraints import slot_is_available_for_teacher


def build_nodes(
    groups: list[GroupContext],
    subjects_map: dict[int, list[SubjectContext]],      # group_id → subjects
    teachers_map: dict[int, list[TeacherContext]],      # subject_id → teachers
    classrooms: list[ClassroomCandidate],
    slots_map: dict[int, list[TimeSlot]],               # group_id → slots
) -> list[ScheduleNode]:
    """
    Genera todos los nodos del grafo.
    Un nodo = una hora de clase que necesita ser asignada.
    """
    nodes: list[ScheduleNode] = []

    for group in groups:
        subjects = subjects_map.get(group.group_id, [])
        slots = slots_map.get(group.group_id, [])

        for subject in subjects:
            teachers = teachers_map.get(subject.subject_id, [])
            teacher = _select_teacher(teachers, slots)

            requires_classroom = (
                group.modality_require_classroom
                or (teacher.require_classroom if teacher else False)
            )

            # Calcular colores válidos para este nodo
            valid_colors = _compute_valid_colors(
                teacher=teacher,
                slots=slots,
                classrooms=classrooms,
                career_id=group.career_id,
                requires_classroom=requires_classroom,
            )

            # Expandir por hours_per_week
            for block_index in range(subject.hours_per_week):
                nodes.append(ScheduleNode(
                    node_id=str(uuid.uuid4()),
                    group_id=group.group_id,
                    career_id=group.career_id,
                    career_subject_id=subject.career_subject_id,
                    subject_id=subject.subject_id,
                    subject_name=subject.subject_name,
                    teacher_id=teacher.teacher_id if teacher else -1,
                    block_index=block_index,
                    requires_classroom=requires_classroom,
                    valid_colors=list(valid_colors),  # copia independiente por nodo
                ))

    return nodes


def _select_teacher(
    teachers: list[TeacherContext],
    slots: list[TimeSlot],
) -> TeacherContext | None:
    """
    Selecciona el profesor con más slots disponibles compatibles con el turno.
    Retorna None si no hay profesores.
    """
    if not teachers:
        return None
    if len(teachers) == 1:
        return teachers[0]

    def available_slot_count(t: TeacherContext) -> int:
        return sum(1 for slot in slots if slot_is_available_for_teacher(t, slot))

    return max(teachers, key=available_slot_count)


def _compute_valid_colors(
    teacher: TeacherContext | None,
    slots: list[TimeSlot],
    classrooms: list[ClassroomCandidate],
    career_id: int,
    requires_classroom: bool,
) -> list[ScheduleColor]:
    """
    Calcula los colores (slot + aula) válidos para un nodo dado.
    """
    valid: list[ScheduleColor] = []

    for slot in slots:
        # Verificar disponibilidad del profesor en este slot
        if teacher and not slot_is_available_for_teacher(teacher, slot):
            continue

        if requires_classroom:
            # Agregar una entrada por cada aula accesible
            accessible = _accessible_classrooms(classrooms, career_id)
            for classroom in accessible:
                valid.append(ScheduleColor(slot=slot, classroom=classroom))
        else:
            valid.append(ScheduleColor(slot=slot, classroom=None))

    return valid


def _accessible_classrooms(
    classrooms: list[ClassroomCandidate],
    career_id: int,
) -> list[ClassroomCandidate]:
    """
    Filtra aulas accesibles para una carrera:
    - No restringidas: accesibles por todos.
    - Restringidas: solo si career_id está en allowed_career_ids.
    """
    return [
        c for c in classrooms
        if not c.is_restricted or career_id in c.allowed_career_ids
    ]
```

---

### 6.2 `graph/edge_builder.py`

```python
from graph.models import ScheduleNode


def build_adjacency(nodes: list[ScheduleNode]) -> dict[str, set[str]]:
    """
    Construye el mapa de adyacencia del grafo.
    Retorna: { node_id → set de node_ids en conflicto }

    Conflictos precalculados:
      - SAME_GROUP:    mismo group_id
      - SAME_TEACHER:  mismo teacher_id (ignorar si teacher_id == -1)

    El conflicto SAME_CLASSROOM se evalúa dinámicamente en DSatur
    porque el classroom es parte del color que se asigna en runtime.
    """
    adjacency: dict[str, set[str]] = {n.node_id: set() for n in nodes}

    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            a, b = nodes[i], nodes[j]

            conflict = (
                a.group_id == b.group_id
                or (a.teacher_id == b.teacher_id and a.teacher_id != -1)
            )

            if conflict:
                adjacency[a.node_id].add(b.node_id)
                adjacency[b.node_id].add(a.node_id)

    return adjacency
```

---

### 6.3 `graph/schedule_graph.py`

```python
from graph.models import ScheduleNode, ScheduleColor


class ScheduleGraph:
    def __init__(self, nodes: list[ScheduleNode], adjacency: dict[str, set[str]]):
        self.nodes: dict[str, ScheduleNode] = {n.node_id: n for n in nodes}
        self.adjacency: dict[str, set[str]] = adjacency

    def get_neighbors(self, node_id: str) -> list[ScheduleNode]:
        return [self.nodes[nid] for nid in self.adjacency.get(node_id, set())]

    def get_used_colors_in_neighborhood(self, node_id: str) -> list[ScheduleColor]:
        """Retorna los colores ya asignados a los vecinos del nodo."""
        return [
            n.assigned_color
            for n in self.get_neighbors(node_id)
            if n.assigned_color is not None
        ]

    def update_saturation(self, node_id: str) -> None:
        """
        Recalcula la saturación del nodo: número de colores de SLOT distintos
        usados por sus vecinos ya asignados.
        """
        node = self.nodes[node_id]
        used_slot_ids = {
            n.assigned_color.slot.slot_id
            for n in self.get_neighbors(node_id)
            if n.assigned_color is not None
        }
        node.saturation = len(used_slot_ids)

    def degree(self, node_id: str) -> int:
        return len(self.adjacency.get(node_id, set()))
```

---

### 6.4 `graph/dsatur.py`

```python
import heapq
from graph.schedule_graph import ScheduleGraph
from graph.models import ScheduleNode, ScheduleColor
from constraints.hard_constraints import violates_hard_constraints


def run_dsatur(graph: ScheduleGraph) -> ScheduleGraph:
    """
    Ejecuta el algoritmo DSatur sobre el grafo.
    Modifica graph.nodes[*].assigned_color in-place.
    Retorna el mismo grafo con nodos asignados donde fue posible.
    """
    # Cola de prioridad: (-saturación, -grado, node_id)
    # Negamos para que heapq (min-heap) funcione como max-heap
    heap = [
        (-node.saturation, -graph.degree(node.node_id), node.node_id)
        for node in graph.nodes.values()
    ]
    heapq.heapify(heap)

    assigned_ids: set[str] = set()

    while heap:
        _, _, node_id = heapq.heappop(heap)

        if node_id in assigned_ids:
            continue

        node = graph.nodes[node_id]
        color = _find_valid_color(node, graph)

        if color:
            node.assigned_color = color
            # Si el color incluye aula, registrarla para detectar conflictos HC-03
        assigned_ids.add(node_id)

        # Actualizar saturación de vecinos y re-insertar en la cola
        for neighbor in graph.get_neighbors(node_id):
            if neighbor.node_id not in assigned_ids:
                graph.update_saturation(neighbor.node_id)
                heapq.heappush(heap, (
                    -neighbor.saturation,
                    -graph.degree(neighbor.node_id),
                    neighbor.node_id,
                ))

    return graph


def _find_valid_color(
    node: ScheduleNode,
    graph: ScheduleGraph,
) -> ScheduleColor | None:
    """
    Itera sobre los valid_colors del nodo (ya ordenados por soft score)
    y retorna el primero que no viole ninguna restricción dura.
    """
    for color in node.valid_colors:
        result = violates_hard_constraints(node, color, graph)
        if not result["violated"]:
            return color
    return None
```

---

## 7. Evaluadores de restricciones (`constraints/`)

### 7.1 `constraints/hard_constraints.py`

```python
from datetime import time
from graph.models import ScheduleNode, ScheduleColor, TeacherContext, TimeSlot


def violates_hard_constraints(
    node: ScheduleNode,
    color: ScheduleColor,
    graph,  # ScheduleGraph — import diferido para evitar circular
) -> dict:
    """
    Retorna {"violated": bool, "reason": str | None}
    """
    slot = color.slot

    for neighbor in graph.get_neighbors(node.node_id):
        if neighbor.assigned_color is None:
            continue

        n_slot = neighbor.assigned_color.slot

        # HC-01: mismo grupo, mismo slot
        if neighbor.group_id == node.group_id and n_slot.slot_id == slot.slot_id:
            return {"violated": True, "reason": "HC-01: grupo duplicado en slot"}

        # HC-02: mismo profesor, mismo slot
        if (
            neighbor.teacher_id == node.teacher_id
            and node.teacher_id != -1
            and n_slot.slot_id == slot.slot_id
        ):
            return {"violated": True, "reason": "HC-02: profesor duplicado en slot"}

    # HC-03: mismo salón, mismo slot (búsqueda global)
    if color.classroom:
        for other in graph.nodes.values():
            if (
                other.node_id != node.node_id
                and other.assigned_color is not None
                and other.assigned_color.slot.slot_id == slot.slot_id
                and other.assigned_color.classroom is not None
                and other.assigned_color.classroom.classroom_id == color.classroom.classroom_id
            ):
                return {"violated": True, "reason": "HC-03: aula ocupada"}

    return {"violated": False, "reason": None}


def slot_is_available_for_teacher(teacher: TeacherContext, slot: TimeSlot) -> bool:
    """
    Verifica si el profesor está disponible en el slot dado.
    Retorna True si NO hay ningún bloque de no-disponibilidad que se solape,
    o si directamente no tiene disponibilidades registradas (se asume disponible).
    """
    day_blocks = [b for b in teacher.availability if b.day_of_week == slot.day_of_week]

    if not day_blocks:
        return True  # sin restricciones registradas → disponible

    for block in day_blocks:
        # El slot se solapa con este bloque
        if slot.start_time < block.end and slot.end_time > block.start:
            if not block.is_available:
                return False

    return True
```

---

### 7.2 `constraints/soft_constraints.py`

```python
from datetime import datetime, timedelta
from graph.models import ScheduleNode, ScheduleColor, TimeSlot


def score_color(
    node: ScheduleNode,
    color: ScheduleColor,
    graph,  # ScheduleGraph
) -> int:
    """
    Puntúa un color para un nodo. Menor score = más deseable.
    Se usa para ordenar valid_colors antes de correr DSatur.
    """
    score = 0

    # SC-02: penalizar si ya hay otra clase de la misma materia ese día
    same_subject_same_day = any(
        n.group_id == node.group_id
        and n.subject_id == node.subject_id
        and n.assigned_color is not None
        and n.assigned_color.slot.day_of_week == color.slot.day_of_week
        for n in graph.nodes.values()
    )
    if same_subject_same_day:
        score += 10

    # SC-01: penalizar si genera un hueco > 60 min en el grupo ese día
    group_slots_that_day = [
        n.assigned_color.slot
        for n in graph.nodes.values()
        if n.group_id == node.group_id
        and n.assigned_color is not None
        and n.assigned_color.slot.day_of_week == color.slot.day_of_week
    ]
    if _creates_gap(color.slot, group_slots_that_day):
        score += 5

    return score


def _creates_gap(new_slot: TimeSlot, existing_slots: list[TimeSlot]) -> bool:
    """
    Verifica si insertar new_slot en la lista deja un hueco > 60 min
    entre dos clases consecutivas del grupo.
    """
    if not existing_slots:
        return False

    all_slots = sorted(existing_slots + [new_slot], key=lambda s: s.start_time)

    for i in range(len(all_slots) - 1):
        end_current = datetime.combine(datetime.today(), all_slots[i].end_time)
        start_next = datetime.combine(datetime.today(), all_slots[i + 1].start_time)
        gap_minutes = (start_next - end_current).seconds // 60
        if gap_minutes > 60:
            return True

    return False
```

---

## 8. Servicio orquestador (`services.py`)

```python
from loaders.university_context import load_university_context
from loaders.groups_loader import load_active_groups
from loaders.subjects_loader import load_subjects_for_group
from loaders.teachers_loader import load_teachers_for_subject
from loaders.classrooms_loader import load_classrooms_for_university
from loaders.slots_builder import build_time_slots
from graph.node_builder import build_nodes
from graph.edge_builder import build_adjacency
from graph.schedule_graph import ScheduleGraph
from graph.dsatur import run_dsatur
from constraints.soft_constraints import score_color
from formatter.schedule_formatter import format_result
from graph.models import GenerationResult


def generate_schedule(university_id: int) -> GenerationResult:
    """
    Punto de entrada principal del módulo.
    Orquesta todas las fases de la generación.
    """

    # ── FASE 1: Contexto ────────────────────────────────────────────────────
    ctx = load_university_context(university_id)
    groups = load_active_groups(
        university_id,
        ctx["active_period_id"],
        ctx["uses_period_groups"],
    )

    if not groups:
        raise ValueError("NO_ACTIVE_GROUPS")

    classrooms = load_classrooms_for_university(university_id)

    # ── FASE 2: Materias y profesores ───────────────────────────────────────
    subjects_map: dict[int, list] = {}
    teachers_map: dict[int, list] = {}

    for group in groups:
        subjects = load_subjects_for_group(group.career_id, group.period_number)
        subjects_map[group.group_id] = subjects

        for subject in subjects:
            if subject.subject_id not in teachers_map:
                teachers_map[subject.subject_id] = load_teachers_for_subject(
                    subject.subject_id, university_id
                )

    # ── FASE 3: Slots por grupo ─────────────────────────────────────────────
    slots_map: dict[int, list] = {}
    for group in groups:
        slots_map[group.group_id] = build_time_slots(
            shift_start=group.shift_start,
            shift_end=group.shift_end,
            allowed_days=group.allowed_days,
        )

    # ── FASE 4: Construir nodos y grafo ─────────────────────────────────────
    nodes = build_nodes(groups, subjects_map, teachers_map, classrooms, slots_map)
    adjacency = build_adjacency(nodes)
    graph = ScheduleGraph(nodes, adjacency)

    # ── FASE 5: Ordenar valid_colors por soft score ─────────────────────────
    for node in graph.nodes.values():
        node.valid_colors.sort(key=lambda c: score_color(node, c, graph))

    # ── FASE 6: Ejecutar DSatur ─────────────────────────────────────────────
    solved_graph = run_dsatur(graph)

    # ── FASE 7: Formatear resultado ─────────────────────────────────────────
    return format_result(solved_graph, groups, teachers_map, classrooms)
```

---

## 9. Formateador (`formatter/schedule_formatter.py`)

```python
from dataclasses import asdict
from datetime import datetime
from graph.schedule_graph import ScheduleGraph
from graph.models import (
    GroupContext, TeacherContext, ClassroomCandidate,
    GroupSchedule, ScheduleEntry, UnassignedEntry,
    GenerationResult, GenerationSummary,
)


def format_result(
    graph: ScheduleGraph,
    groups: list[GroupContext],
    teachers_map: dict[int, list[TeacherContext]],
    classrooms: list[ClassroomCandidate],
) -> GenerationResult:

    classroom_index = {c.classroom_id: c for c in classrooms}

    # Índice rápido de profesores
    teacher_index: dict[int, TeacherContext] = {}
    for teacher_list in teachers_map.values():
        for t in teacher_list:
            teacher_index[t.teacher_id] = t

    group_schedules: list[GroupSchedule] = []
    total_attempted = 0
    total_assigned = 0
    unassigned_detail = []

    for group in groups:
        group_nodes = [
            n for n in graph.nodes.values() if n.group_id == group.group_id
        ]
        total_attempted += len(group_nodes)

        entries: list[ScheduleEntry] = []
        unassigned: list[UnassignedEntry] = []

        for node in group_nodes:
            if node.assigned_color:
                total_assigned += 1
                color = node.assigned_color
                teacher = teacher_index.get(node.teacher_id)
                classroom = (
                    classroom_index.get(color.classroom.classroom_id)
                    if color.classroom else None
                )
                entries.append(ScheduleEntry(
                    day_of_week=color.slot.day_of_week,
                    start_time=color.slot.start_time.strftime("%H:%M:%S"),
                    end_time=color.slot.end_time.strftime("%H:%M:%S"),
                    subject_id=node.subject_id,
                    subject_name=node.subject_name,
                    subject_color="3B82F6",       # obtener de subjects_map si se pasa
                    subject_contrast_color="FFFFFF",
                    teacher_id=node.teacher_id,
                    teacher_full_name=teacher.full_name if teacher else "Sin asignar",
                    classroom_id=classroom.classroom_id if classroom else None,
                    classroom_name=classroom.name if classroom else None,
                ))
            else:
                reason = _build_unassigned_reason(node)
                entry = UnassignedEntry(
                    subject_id=node.subject_id,
                    subject_name=node.subject_name,
                    reason=reason,
                )
                unassigned.append(entry)
                unassigned_detail.append(asdict(entry))

        # Ordenar entradas por día y hora
        entries.sort(key=lambda e: (e.day_of_week, e.start_time))

        group_schedules.append(GroupSchedule(
            group_id=group.group_id,
            group_name=group.group_name,
            career_id=group.career_id,
            period_number=group.period_number,
            entries=entries,
            unassigned=unassigned,
        ))

    summary = GenerationSummary(
        total_groups=len(groups),
        total_nodes_attempted=total_attempted,
        total_nodes_assigned=total_assigned,
        total_nodes_unassigned=total_attempted - total_assigned,
        unassigned_detail=unassigned_detail,
    )

    return GenerationResult(
        university_id=groups[0].group_id if groups else 0,
        generated_at=datetime.utcnow().isoformat() + "Z",
        group_schedules=group_schedules,
        summary=summary,
    )


def _build_unassigned_reason(node) -> str:
    if node.teacher_id == -1:
        return "Sin profesor asignado a la materia en esta universidad"
    if not node.valid_colors:
        return "Sin slots disponibles: revisar disponibilidad del profesor y turno del grupo"
    return "Conflicto no resuelto por DSatur"
```

---

## 10. Estructura actual del módulo (modular)

El módulo ya no está en archivos planos (`services.py`, `views.py`, `urls.py`).
Ahora usa la misma convención por capas que otros módulos (`subjects`, `classrooms`, etc.):

```text
schedule_generator/
├── generation_logic/
│   ├── constraints/
│   ├── formatter/
│   ├── graph/
│   └── loaders/
├── models/
│   ├── __init__.py
│   └── schedule_versions.py
├── serializers/
│   ├── __init__.py
│   └── schedule_versions/
│       ├── __init__.py
│       ├── schedule_version_detail_serializer.py
│       ├── schedule_version_generate_serializer.py
│       ├── schedule_version_list_serializer.py
│       ├── schedule_version_update_draft_serializer.py
│       └── schedule_version_update_label_serializer.py
├── services/
│   ├── __init__.py
│   ├── schedule_generation_service.py
│   └── schedule_versions_service.py
├── views/
│   ├── __init__.py
│   └── schedule_versions.py
├── urls/
│   ├── __init__.py
│   └── schedules.py
├── migrations/
│   └── 0001_initial.py
└── ...
```

---

## 11. Endpoints implementados para versionado

Todas las rutas están bajo `api/` y usan `RequireSelectedUniversity`.

| Método | Endpoint | Propósito |
|------|------|------|
| `POST` | `/api/v1/university/schedules/generate/` | Genera horario y crea/actualiza el borrador de la universidad seleccionada. |
| `PUT` | `/api/v1/university/schedules/drafts/{pk}/` | Modifica datos del borrador (`label`, `parameters`, `data`, contadores, `academic_period_id`) sin tocar `is_confirmed`. |
| `PUT` | `/api/v1/university/schedules/{pk}/confirm/` | Confirma versión (`is_confirmed=1`, `confirmed_at=now`) y libera draft de la universidad en configuración de usuario. |
| `DELETE` | `/api/v1/university/schedules/drafts/{pk}/` | Eliminación lógica de borrador no confirmado (`is_deleted=1`). |
| `PUT` | `/api/v1/university/schedules/{pk}/label/` | Actualiza únicamente el label. |
| `GET` | `/api/v1/university/schedules/paginated/` | Historial paginado (no eliminadas, orden reciente -> antiguo). |
| `GET` | `/api/v1/university/schedules/{pk}/` | `findById` restringido a universidad seleccionada y sin campos internos (`is_deleted`, `created_by`, `updated_by`). |

Ruta legada que se conserva para pruebas del algoritmo sin persistencia:

| Método | Endpoint | Propósito |
|------|------|------|
| `POST` | `/api/schedule-generator/preview/` | Ejecuta solo preview en memoria (no guarda versión). |

---

## 12. Reglas de negocio de versionado

1. Solo existe un borrador activo por universidad.
2. `POST /generate/` actualiza el borrador si ya existe; si no existe, lo crea.
3. Si por datos heredados hay múltiples borradores activos, se conserva el más reciente y los demás se marcan como eliminados.
4. Confirmar o eliminar borrador sincroniza `user_configurations.schedule_generation.draft_schedule_university_ids` removiendo la universidad.
5. Generar/actualizar borrador agrega la universidad a `draft_schedule_university_ids`.
6. `selected_university_id` es independiente de `draft_schedule_university_ids` fuera del flujo explícito de borrador.
7. El detalle público de versión no expone campos internos de auditoría ni borrado lógico.
8. Los campos de auditoría (`created_*`, `updated_*`) no se actualizan desde backend; quedan a cargo de triggers de base de datos.

---

## 13. Modelo persistente `schedule_versions`

Se agrega la tabla de persistencia con campos de negocio:

- `label`
- `university_id`
- `academic_period_id`
- `parameters` (JSON)
- `data` (JSON)
- `assigned_count`
- `unassigned_count`
- `is_confirmed`
- `confirmed_at`
- `is_deleted`
- `created_at`, `created_by`, `updated_at`, `updated_by`

Migración: `schedule_generator/migrations/0001_initial.py`.

---

## 14. Casos especiales a manejar explícitamente

| Caso | Cómo manejarlo |
|------|----------------|
| `uses_period_groups = False` | No filtrar por `academic_period_id` en `groups_loader` |
| `uses_period_groups = True` sin periodo activo | Lanzar `ValueError("NO_ACTIVE_PERIOD")` |
| Grupo en `career_period_exceptions` | Excluir en `groups_loader` con el set de excepciones |
| Materia sin profesor en esta universidad | `teacher_id = -1`, `valid_colors = []` → NO_ASIGNADO |
| Profesor sin disponibilidades registradas | Asumir disponible en todos los slots del turno |
| `modality.require_classroom = 0` y `teacher.require_classroom = 0` | `color.classroom = None` |
| `modality.require_classroom = 0` y `teacher.require_classroom = 1` | Buscar aula igualmente (HC-10) |
| Aula restringida (`is_restricted = True`) | Solo asignar si `career_id` en `allowed_career_ids` |
| `hours_per_week > días disponibles` | SC-02 no satisfacible; asignar igualmente |
| No hay aulas disponibles | `valid_colors` sin colores con aula → NO_ASIGNADO |

---

## 15. Alcance actual y fuera de alcance

Implementado en esta fase:

- ✅ Generación de horario con DSatur y restricciones.
- ✅ Persistencia de versiones (`schedule_versions`) con ciclo de borrador/confirmación.
- ✅ Historial paginado y consulta por id restringida por universidad.
- ✅ Sincronización de borradores por universidad en `user_configurations.schedule_generation`.

Fuera de alcance por ahora:

- ❌ Editor visual/manual del horario confirmado.
- ❌ Publicación/notificación automática del horario.
- ❌ Motor de resolución incremental entre dos versiones confirmadas.
- ❌ Validación por capacidad de aula (no existe `capacity` en el esquema actual).