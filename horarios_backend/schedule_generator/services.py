from schedule_generator.formatter import format_generated_schedule
from schedule_generator.graph import (
    build_schedule_adjacency,
    build_schedule_nodes,
    run_dsatur_coloring,
)
from schedule_generator.loaders import (
    build_time_slots,
    load_active_groups,
    load_classrooms_for_university,
    load_subjects_for_group,
    load_teachers_for_subject,
    load_university_context,
)


def generate_schedule(
    university_id: int,
):
    """Orquesta la generacion completa de horarios para una universidad."""
    # 1) Contexto base de la universidad (horario institucional y periodo activo).
    university_context = load_university_context(university_id)

    uses_period_groups = bool(university_context.get('uses_period_groups', False))

    # 2) Cargar grupos candidatos que entran al proceso.
    groups = load_active_groups(
        university_id=university_id,
        active_period_id=university_context.get('active_period_id'),
        uses_period_groups=uses_period_groups,
    )

    if not groups:
        raise ValueError('NO_ACTIVE_GROUPS')

    # 3) Cargar aulas una sola vez para reutilizarlas en todas las asignaciones.
    classrooms = load_classrooms_for_university(university_id)

    nodes = []
    slots_by_id = {}

    for group in groups:
        # 4) Cargar materias del periodo del grupo actual.
        subjects = load_subjects_for_group(group.career_id, group.period_number)
        if not subjects:
            continue

        # 5) Construir rejilla de slots validos segun turno y dias permitidos.
        group_slots = build_time_slots(
            shift_start=group.shift_start,
            shift_end=group.shift_end,
            allowed_days=group.allowed_days,
        )
        if not group_slots:
            continue

        teachers_by_subject = {}

        # 6) Resolver candidatos de profesor por materia para este grupo.
        for subject in subjects:
            teachers_by_subject[subject.subject_id] = load_teachers_for_subject(
                subject_id=subject.subject_id,
                university_id=university_id,
            )

        # 7) Expandir nodos por horas semanales de cada materia.
        nodes.extend(
            build_schedule_nodes(
                group=group,
                subjects=subjects,
                teachers_by_subject=teachers_by_subject,
                group_slots=group_slots,
            )
        )

        # Se unifican slots en un mapa para evitar duplicados entre grupos/turnos.
        for slot in group_slots:
            slots_by_id[slot.slot_id] = slot

    if not nodes:
        raise ValueError('NO_SCHEDULABLE_SUBJECTS')

    ordered_slots = sorted(
        slots_by_id.values(),
        key=lambda slot: (slot.day_of_week, slot.start_time, slot.end_time, slot.slot_id),
    )

    # 8) Construir conflictos del grafo y resolver con DSatur adaptado.
    adjacency = build_schedule_adjacency(nodes)
    solved = run_dsatur_coloring(
        graph_nodes=nodes,
        adjacency=adjacency,
        slots=ordered_slots,
        classrooms=classrooms,
        soft_weights={
            'spread_days_weight': 4.0,
            'day_order_weight': 0.1,
            'hour_order_weight': 0.01,
        },
    )

    # 9) Formatear salida API amigable para frontend/consumo externo.
    return format_generated_schedule(
        university_id=university_id,
        uses_period_groups=uses_period_groups,
        nodes=nodes,
        assignments=solved.assignments,
        unassigned=solved.unassigned,
    )
