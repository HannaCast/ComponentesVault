from schedule_generator.generation_logic.graph.models import (
    GroupContext,
    ScheduleNode,
    SubjectContext,
    TeacherContext,
    TimeSlot,
)

# Función que expande materias a nodos de grafo segun horas por semana, asignando candidatos y slots permitidos.
def build_schedule_nodes(
    group: GroupContext,
    subjects: list[SubjectContext],
    teachers_by_subject: dict[int, list[TeacherContext]],
    group_slots: list[TimeSlot],
) -> list[ScheduleNode]:
    """Expande materias a nodos de grafo segun horas por semana."""
    nodes: list[ScheduleNode] = []
    # Cada nodo del grupo solo puede pintarse con slots del propio grupo.
    allowed_slot_ids = {slot.slot_id for slot in group_slots}

    for subject in subjects:
        teacher_candidates = teachers_by_subject.get(subject.subject_id, [])
        hours_per_week = max(int(subject.hours_per_week), 1)

        # Una materia de N horas genera N nodos independientes en el grafo.
        for hour_index in range(hours_per_week):
            nodes.append(
                ScheduleNode(
                    node_key=(
                        f'G{group.group_id}_S{subject.subject_id}_'
                        f'C{subject.career_subject_id}_H{hour_index + 1}'
                    ),
                    group_id=group.group_id,
                    group_name=group.group_name,
                    career_id=group.career_id,
                    period_number=group.period_number,
                    subject_id=subject.subject_id,
                    subject_name=subject.subject_name,
                    # Copia defensiva para mantener independencia entre nodos.
                    allowed_slot_ids=set(allowed_slot_ids),
                    teacher_candidates=teacher_candidates,
                    require_classroom=group.modality_require_classroom,
                    color_hex=subject.color_hex,
                    contrast_hex=subject.contrast_hex,
                )
            )

    return nodes
