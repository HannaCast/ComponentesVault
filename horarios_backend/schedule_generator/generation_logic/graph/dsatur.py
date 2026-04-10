from collections import defaultdict

from schedule_generator.generation_logic.constraints.hard_constraints import (
    can_use_classroom,
    can_use_teacher,
)
from schedule_generator.generation_logic.constraints.soft_constraints import compute_slot_penalty
from schedule_generator.generation_logic.graph.models import (
    ClassroomCandidate,
    DSaturResult,
    ScheduleAssignment,
    ScheduleNode,
    TeacherContext,
    TimeSlot,
    UnassignedNode,
)


def _fallback_option_one_rank(
    classroom: ClassroomCandidate,
    node: ScheduleNode,
) -> tuple[int, int, int, int, int]:
    """Ranking hardcodeado para universidades sin configuracion de prioridades."""
    classroom_type_name = (classroom.classroom_type_name or '').strip().lower()
    is_regular_classroom = classroom_type_name in {'aula', 'salon', 'salón'}

    # Para materias sin restriccion por tipo se intenta primero aula general.
    prefer_regular_classroom = (
        0 if (not node.is_restricted_to_classroom_types and is_regular_classroom) else 1
    )

    return (
        prefer_regular_classroom,
        0 if not classroom.is_restricted else 1,
        0 if not classroom.is_restricted_to_subjects else 1,
        len(classroom.allowed_career_ids) if classroom.is_restricted else 0,
        classroom.classroom_id,
    )


def _priority_config_rank(classroom: ClassroomCandidate) -> tuple[int, int, int, int, int]:
    """Ranking por prioridad de tipo configurada por universidad."""
    return (
        int(classroom.classroom_type_priority or 9999),
        0 if not classroom.is_restricted else 1,
        0 if not classroom.is_restricted_to_subjects else 1,
        len(classroom.allowed_career_ids) if classroom.is_restricted else 0,
        classroom.classroom_id,
    )

# Implementación del algoritmo DSatur adaptado a la generación de horarios académicos, con restricciones de profesor y aula.
def _select_next_node(
    uncolored: set[str],
    adjacency: dict[str, set[str]],
    colors: dict[str, str],
) -> str:
    """Elige el siguiente nodo por criterio DSatur: saturacion y grado."""
    def _rank(node_key: str) -> tuple[int, int, str]:
        colored_neighbors = {
            colors[neighbor]
            for neighbor in adjacency.get(node_key, set())
            if neighbor in colors
        }
        saturation_degree = len(colored_neighbors)
        total_degree = len(adjacency.get(node_key, set()))
        return (saturation_degree, total_degree, node_key)

    return max(uncolored, key=_rank)

# Funciones auxiliares para elegir profesor y aula factibles, priorizando carga y restricciones.
def _choose_teacher(
    node: ScheduleNode,
    slot: TimeSlot,
    teacher_busy: set[tuple[int, str]],
    teacher_load: dict[int, int],
) -> TeacherContext | None:
    """Selecciona profesor factible para un slot, priorizando menor carga."""
    feasible_teachers = []

    for teacher in node.teacher_candidates:
        if can_use_teacher(teacher, slot, teacher_busy):
            feasible_teachers.append(
                (
                    teacher_load.get(teacher.teacher_id, 0),
                    teacher.teacher_id,
                    teacher,
                )
            )

    if not feasible_teachers:
        return None

    feasible_teachers.sort(key=lambda item: (item[0], item[1]))
    return feasible_teachers[0][2]


def _choose_classroom(
    node: ScheduleNode,
    slot_id: str,
    classrooms: list[ClassroomCandidate],
    classroom_busy: set[tuple[int, str]],
    require_classroom: bool,
    has_university_type_priorities: bool,
) -> ClassroomCandidate | None:
    """Selecciona aula factible para el slot respetando restricciones."""
    if not require_classroom:
        return None

    feasible_classrooms = []
    for classroom in classrooms:
        if can_use_classroom(
            classroom=classroom,
            career_id=node.career_id,
            subject_id=node.subject_id,
            slot_id=slot_id,
            classroom_busy=classroom_busy,
            is_restricted_to_classroom_types=node.is_restricted_to_classroom_types,
            allowed_classroom_type_ids=node.allowed_classroom_type_ids,
        ):
            feasible_classrooms.append(classroom)

    if not feasible_classrooms:
        return None

    if has_university_type_priorities:
        feasible_classrooms.sort(key=_priority_config_rank)
    else:
        # Fallback cuando la universidad no tiene configuracion en la tabla nueva.
        feasible_classrooms.sort(key=lambda classroom: _fallback_option_one_rank(classroom, node))

    return feasible_classrooms[0]

# La función principal de DSatur, que asigna slots a nodos respetando restricciones de profesor y aula.
def run_dsatur_coloring(
    graph_nodes: list[ScheduleNode],
    adjacency: dict[str, set[str]],
    slots: list[TimeSlot],
    classrooms: list[ClassroomCandidate],
    soft_weights: dict | None = None,
) -> DSaturResult:
    """Resuelve asignaciones con DSatur + restricciones de profesor/aula."""
    if not graph_nodes:
        return DSaturResult(assignments=[], unassigned=[])

    if not slots:
        return DSaturResult(
            assignments=[],
            unassigned=[
                UnassignedNode(node_key=node.node_key, reason='NO_AVAILABLE_SLOTS')
                for node in graph_nodes
            ],
        )

    nodes_by_key = {node.node_key: node for node in graph_nodes}
    colors: dict[str, str] = {}
    assignments_by_key: dict[str, ScheduleAssignment] = {}
    unassigned: list[UnassignedNode] = []

    teacher_busy: set[tuple[int, str]] = set()
    classroom_busy: set[tuple[int, str]] = set()

    teacher_load: dict[int, int] = defaultdict(int)
    group_day_load: dict[tuple[int, int], int] = defaultdict(int)

    has_university_type_priorities = any(
        classroom.classroom_type_priority is not None for classroom in classrooms
    )

    uncolored = set(nodes_by_key)

    while uncolored:
        # 1) Seleccionar nodo mas restrictivo en este momento del proceso.
        node_key = _select_next_node(uncolored, adjacency, colors)
        node = nodes_by_key[node_key]

        if not node.teacher_candidates:
            unassigned.append(
                UnassignedNode(node_key=node.node_key, reason='NO_TEACHER_FOR_SUBJECT')
            )
            uncolored.remove(node_key)
            continue

        forbidden_slots = {
            colors[neighbor]
            for neighbor in adjacency.get(node_key, set())
            if neighbor in colors
        }

        # 2) Filtrar slots: no chocar con vecinos ya pintados y respetar ventana del nodo.
        candidate_slots = [
            slot
            for slot in slots
            if slot.slot_id not in forbidden_slots and slot.slot_id in node.allowed_slot_ids
        ]

        if not candidate_slots:
            unassigned.append(
                UnassignedNode(node_key=node.node_key, reason='NO_GRAPH_COLOR_AVAILABLE')
            )
            uncolored.remove(node_key)
            continue

        best_candidate = None

        # 3) Evaluar combinaciones factibles y elegir la de menor penalizacion.
        for slot in candidate_slots:
            teacher = _choose_teacher(node, slot, teacher_busy, teacher_load)
            if teacher is None:
                continue

            require_classroom = node.require_classroom or teacher.require_classroom
            classroom = _choose_classroom(
                node=node,
                slot_id=slot.slot_id,
                classrooms=classrooms,
                classroom_busy=classroom_busy,
                require_classroom=require_classroom,
                has_university_type_priorities=has_university_type_priorities,
            )

            if require_classroom and classroom is None:
                continue

            penalty = compute_slot_penalty(
                group_id=node.group_id,
                slot=slot,
                group_day_load=group_day_load,
                soft_weights=soft_weights,
            )

            rank = (
                penalty,
                slot.day_of_week,
                slot.start_time,
                teacher_load.get(teacher.teacher_id, 0),
            )

            if best_candidate is None or rank < best_candidate['rank']:
                best_candidate = {
                    'rank': rank,
                    'slot': slot,
                    'teacher': teacher,
                    'classroom': classroom,
                }

        if best_candidate is None:
            unassigned.append(
                UnassignedNode(node_key=node.node_key, reason='NO_FEASIBLE_ASSIGNMENT') 
            )
            uncolored.remove(node_key)
            continue

        # 4) Confirmar asignacion y actualizar estructuras de ocupacion.
        chosen_slot = best_candidate['slot']
        chosen_teacher = best_candidate['teacher']
        chosen_classroom = best_candidate['classroom']

        colors[node_key] = chosen_slot.slot_id
        uncolored.remove(node_key)

        teacher_busy.add((chosen_teacher.teacher_id, chosen_slot.slot_id))
        teacher_load[chosen_teacher.teacher_id] += 1
        group_day_load[(node.group_id, chosen_slot.day_of_week)] += 1

        classroom_id = None
        classroom_name = None
        if chosen_classroom is not None:
            classroom_busy.add((chosen_classroom.classroom_id, chosen_slot.slot_id))
            classroom_id = chosen_classroom.classroom_id
            classroom_name = chosen_classroom.name

        assignments_by_key[node_key] = ScheduleAssignment(
            node_key=node_key,
            slot_id=chosen_slot.slot_id,
            day_of_week=chosen_slot.day_of_week,
            start_time=chosen_slot.start_time,
            end_time=chosen_slot.end_time,
            teacher_id=chosen_teacher.teacher_id,
            teacher_name=chosen_teacher.full_name,
            classroom_id=classroom_id,
            classroom_name=classroom_name,
        )

    return DSaturResult(
        assignments=list(assignments_by_key.values()),
        unassigned=unassigned,
    )
