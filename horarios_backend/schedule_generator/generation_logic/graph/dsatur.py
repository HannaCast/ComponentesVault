from collections import defaultdict
import random

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
    *,
    include_classroom_id: bool = True,
) -> tuple[int, ...]:
    """Ranking hardcodeado para universidades sin configuracion de prioridades."""
    classroom_type_name = (classroom.classroom_type_name or '').strip().lower()
    is_regular_classroom = classroom_type_name in {'aula', 'salon', 'salón'}

    # Para materias sin restriccion por tipo se intenta primero aula general.
    prefer_regular_classroom = (
        0 if (not node.is_restricted_to_classroom_types and is_regular_classroom) else 1
    )

    base_rank = (
        prefer_regular_classroom,
        0 if not classroom.is_restricted else 1,
        0 if not classroom.is_restricted_to_subjects else 1,
        len(classroom.allowed_career_ids) if classroom.is_restricted else 0,
    )

    if include_classroom_id:
        return (*base_rank, classroom.classroom_id)

    return base_rank


def _priority_config_rank(
    classroom: ClassroomCandidate,
    *,
    include_classroom_id: bool = True,
) -> tuple[int, ...]:
    """Ranking por prioridad de tipo configurada por universidad."""
    base_rank = (
        int(classroom.classroom_type_priority or 9999),
        0 if not classroom.is_restricted else 1,
        0 if not classroom.is_restricted_to_subjects else 1,
        len(classroom.allowed_career_ids) if classroom.is_restricted else 0,
    )

    if include_classroom_id:
        return (*base_rank, classroom.classroom_id)

    return base_rank

# Implementación del algoritmo DSatur adaptado a la generación de horarios académicos, con restricciones de profesor y aula.
def _select_next_node(
    uncolored: set[str],
    adjacency: dict[str, set[str]],
    colors: dict[str, str],
    randomizer: random.Random | None = None,
) -> str:
    """Elige el siguiente nodo por criterio DSatur: saturacion y grado."""
    best_rank = None
    best_nodes: list[str] = []

    for node_key in uncolored:
        colored_neighbors = {
            colors[neighbor]
            for neighbor in adjacency.get(node_key, set())
            if neighbor in colors
        }
        rank = (
            len(colored_neighbors),
            len(adjacency.get(node_key, set())),
        )

        if best_rank is None or rank > best_rank:
            best_rank = rank
            best_nodes = [node_key]
        elif rank == best_rank:
            best_nodes.append(node_key)

    if randomizer is not None and len(best_nodes) > 1:
        return randomizer.choice(best_nodes)

    return max(best_nodes)

# Funciones auxiliares para elegir profesor y aula factibles, priorizando carga y restricciones.
def _choose_teacher(
    node: ScheduleNode,
    slot: TimeSlot,
    teacher_busy: set[tuple[int, str]],
    teacher_load: dict[int, int],
    fixed_teacher_id: int | None = None,
    randomizer: random.Random | None = None,
) -> TeacherContext | None:
    """Selecciona profesor factible para un slot, priorizando menor carga."""
    if fixed_teacher_id is not None:
        for teacher in node.teacher_candidates:
            if teacher.teacher_id != fixed_teacher_id:
                continue

            if can_use_teacher(teacher, slot, teacher_busy):
                return teacher

        return None

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

    minimum_load = min(item[0] for item in feasible_teachers)
    best_teachers = [
        item[2]
        for item in feasible_teachers
        if item[0] == minimum_load
    ]

    if randomizer is not None and len(best_teachers) > 1:
        return randomizer.choice(best_teachers)

    best_teachers.sort(key=lambda teacher: teacher.teacher_id)
    return best_teachers[0]


def _choose_classroom(
    node: ScheduleNode,
    slot_id: str,
    classrooms: list[ClassroomCandidate],
    classroom_busy: set[tuple[int, str]],
    require_classroom: bool,
    has_university_type_priorities: bool,
    randomizer: random.Random | None = None,
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

    if randomizer is not None:
        if has_university_type_priorities:
            ranked = [
                (
                    _priority_config_rank(classroom, include_classroom_id=False),
                    classroom,
                )
                for classroom in feasible_classrooms
            ]
        else:
            ranked = [
                (
                    _fallback_option_one_rank(
                        classroom,
                        node,
                        include_classroom_id=False,
                    ),
                    classroom,
                )
                for classroom in feasible_classrooms
            ]

        best_rank = min(rank for rank, _ in ranked)
        best_classrooms = [
            classroom
            for rank, classroom in ranked
            if rank == best_rank
        ]

        if len(best_classrooms) > 1:
            return randomizer.choice(best_classrooms)

        return best_classrooms[0]

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
    allow_multiple_teachers_per_group_subject: bool = False,
    randomize_generation: bool = False,
    random_seed: int | None = None,
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
    assigned_teacher_by_group_subject: dict[tuple[int, int], int] = {}

    teacher_load: dict[int, int] = defaultdict(int)
    group_day_load: dict[tuple[int, int], int] = defaultdict(int)

    has_university_type_priorities = any(
        classroom.classroom_type_priority is not None for classroom in classrooms
    )
    randomizer = random.Random(random_seed) if randomize_generation else None

    uncolored = set(nodes_by_key)

    while uncolored:
        # 1) Seleccionar nodo mas restrictivo en este momento del proceso.
        node_key = _select_next_node(
            uncolored,
            adjacency,
            colors,
            randomizer=randomizer,
        )
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

        best_rank = None
        best_candidates: list[dict] = []
        group_subject_key = (node.group_id, node.subject_id)
        fixed_teacher_id = None

        if not allow_multiple_teachers_per_group_subject:
            fixed_teacher_id = assigned_teacher_by_group_subject.get(group_subject_key)

        # 3) Evaluar combinaciones factibles y elegir la de menor penalizacion.
        for slot in candidate_slots:
            teacher = _choose_teacher(
                node,
                slot,
                teacher_busy,
                teacher_load,
                fixed_teacher_id=fixed_teacher_id,
                randomizer=randomizer,
            )
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
                randomizer=randomizer,
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

            candidate = {
                'rank': rank,
                'slot': slot,
                'teacher': teacher,
                'classroom': classroom,
            }

            if best_rank is None or rank < best_rank:
                best_rank = rank
                best_candidates = [candidate]
            elif rank == best_rank:
                best_candidates.append(candidate)

        if not best_candidates:
            unassigned.append(
                UnassignedNode(node_key=node.node_key, reason='NO_FEASIBLE_ASSIGNMENT') 
            )
            uncolored.remove(node_key)
            continue

        if randomizer is not None and len(best_candidates) > 1:
            best_candidate = randomizer.choice(best_candidates)
        else:
            best_candidate = best_candidates[0]

        # 4) Confirmar asignacion y actualizar estructuras de ocupacion.
        chosen_slot = best_candidate['slot']
        chosen_teacher = best_candidate['teacher']
        chosen_classroom = best_candidate['classroom']

        colors[node_key] = chosen_slot.slot_id
        uncolored.remove(node_key)

        teacher_busy.add((chosen_teacher.teacher_id, chosen_slot.slot_id))
        teacher_load[chosen_teacher.teacher_id] += 1
        group_day_load[(node.group_id, chosen_slot.day_of_week)] += 1

        if not allow_multiple_teachers_per_group_subject:
            assigned_teacher_by_group_subject[group_subject_key] = chosen_teacher.teacher_id

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
