from dataclasses import dataclass
from datetime import datetime, timezone

from schedule_generator.graph.models import ScheduleAssignment, ScheduleNode, UnassignedNode


@dataclass(slots=True)
class ScheduleGenerationPayload:
    university_id: int
    generated_at: str
    uses_period_groups: bool
    groups: list[dict]
    unassigned: list[dict]
    summary: dict


def _to_hhmm(value) -> str:
    return value.strftime('%H:%M')


def _to_css_hex(value: str) -> str:
    normalized = (value or '').strip().lstrip('#')
    if len(normalized) not in (3, 6):
        normalized = '3B82F6'
    return f'#{normalized.upper()}'

# Transforma resultado interno del algoritmo al payload final de API.
def format_generated_schedule(
    university_id: int,
    uses_period_groups: bool,
    nodes: list[ScheduleNode],
    assignments: list[ScheduleAssignment],
    unassigned: list[UnassignedNode],
) -> ScheduleGenerationPayload:
    """Transforma resultado interno del algoritmo al payload final de API."""
    nodes_by_key = {node.node_key: node for node in nodes}

    grouped: dict[int, dict] = {}

    # Orden estable para entregar salida consistente entre ejecuciones.
    sorted_assignments = sorted(
        assignments,
        key=lambda assignment: (
            nodes_by_key[assignment.node_key].group_id,
            assignment.day_of_week,
            assignment.start_time,
            assignment.node_key,
        ),
    )

    for assignment in sorted_assignments:
        node = nodes_by_key.get(assignment.node_key)
        if node is None:
            continue

        # Se agrupa por grupo para facilitar renderizado de calendario en frontend.
        if node.group_id not in grouped:
            grouped[node.group_id] = {
                'group_id': node.group_id,
                'group_name': node.group_name,
                'career_id': node.career_id,
                'period_number': node.period_number,
                'blocks': [],
            }

        grouped[node.group_id]['blocks'].append(
            {
                'node_key': assignment.node_key,
                'subject': {
                    'id': node.subject_id,
                    'name': node.subject_name,
                },
                'slot': {
                    'id': assignment.slot_id,
                    'day_of_week': assignment.day_of_week,
                    'start_time': _to_hhmm(assignment.start_time),
                    'end_time': _to_hhmm(assignment.end_time),
                },
                'teacher': {
                    'id': assignment.teacher_id,
                    'name': assignment.teacher_name,
                },
                'classroom': {
                    'id': assignment.classroom_id,
                    'name': assignment.classroom_name,
                },
                'color': {
                    'hex': _to_css_hex(node.color_hex),
                    'contrast_hex': _to_css_hex(node.contrast_hex),
                },
            }
        )

    # Mantener no-asignados visibles ayuda a depurar datos faltantes o restricciones duras.
    unassigned_payload = []
    for item in unassigned:
        node = nodes_by_key.get(item.node_key)
        unassigned_payload.append(
            {
                'node_key': item.node_key,
                'reason': item.reason,
                'group_id': node.group_id if node else None,
                'group_name': node.group_name if node else None,
                'subject_id': node.subject_id if node else None,
                'subject_name': node.subject_name if node else None,
            }
        )

    # Orden por group_id para estabilidad en respuesta y pruebas.
    groups_payload = [grouped[group_id] for group_id in sorted(grouped.keys())]

    return ScheduleGenerationPayload(
        university_id=university_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        uses_period_groups=uses_period_groups,
        groups=groups_payload,
        unassigned=unassigned_payload,
        summary={
            'groups_scheduled': len(groups_payload),
            'total_blocks_assigned': len(assignments),
            'total_blocks_unassigned': len(unassigned_payload),
        },
    )
