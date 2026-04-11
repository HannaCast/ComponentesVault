from dataclasses import dataclass
from datetime import datetime, timezone

from schedule_generator.generation_logic.graph.models import (
    GroupContext,
    ScheduleAssignment,
    ScheduleNode,
    UnassignedNode,
)


@dataclass(slots=True)
class ScheduleGenerationPayload:
    university_id: int
    generated_at: str
    uses_period_groups: bool
    active_academic_period: dict | None
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


def _serialize_active_period(active_period: dict | None) -> dict | None:
    if not isinstance(active_period, dict):
        return None

    period_id = active_period.get('id')
    if not period_id:
        return None

    return {
        'id': period_id,
        'name': active_period.get('name'),
        'year': active_period.get('year'),
        'order': active_period.get('order'),
        'start_month': active_period.get('start_month'),
        'end_month': active_period.get('end_month'),
    }


def _serialize_group_career(group_context: GroupContext | None, node: ScheduleNode) -> dict:
    return {
        'id': node.career_id,
        'name': group_context.career_name if group_context else None,
        'short_name': group_context.career_short_name if group_context else None,
        'code': group_context.career_code if group_context else None,
    }


def _serialize_group_shift(group_context: GroupContext | None) -> dict | None:
    if group_context is None:
        return None

    return {
        'id': group_context.shift_id,
        'name': group_context.shift_name,
        'start_time': _to_hhmm(group_context.shift_start),
        'end_time': _to_hhmm(group_context.shift_end),
    }


def _serialize_group_period(
    group_context: GroupContext | None,
    active_period: dict | None,
) -> dict | None:
    if group_context and group_context.academic_period_id:
        return {
            'id': group_context.academic_period_id,
            'name': group_context.academic_period_name,
            'year': group_context.academic_period_year,
            'order': group_context.academic_period_order,
        }

    return active_period

# Transforma resultado interno del algoritmo al payload final de API.
def format_generated_schedule(
    university_id: int,
    uses_period_groups: bool,
    active_academic_period: dict | None,
    groups_context: list[GroupContext],
    nodes: list[ScheduleNode],
    assignments: list[ScheduleAssignment],
    unassigned: list[UnassignedNode],
) -> ScheduleGenerationPayload:
    """Transforma resultado interno del algoritmo al payload final de API."""
    nodes_by_key = {node.node_key: node for node in nodes}
    groups_by_id = {group.group_id: group for group in groups_context}
    normalized_active_period = _serialize_active_period(active_academic_period)

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
            group_context = groups_by_id.get(node.group_id)
            allowed_days = group_context.allowed_days if group_context else [1, 2, 3, 4, 5]

            grouped[node.group_id] = {
                'group_id': node.group_id,
                'group_name': node.group_name,
                'career_id': node.career_id,
                'career': _serialize_group_career(group_context, node),
                'period_number': node.period_number,
                'shift': _serialize_group_shift(group_context),
                'academic_period': _serialize_group_period(group_context, normalized_active_period),
                'allowed_days': allowed_days,
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
        active_academic_period=normalized_active_period,
        groups=groups_payload,
        unassigned=unassigned_payload,
        summary={
            'groups_scheduled': len(groups_payload),
            'total_blocks_assigned': len(assignments),
            'total_blocks_unassigned': len(unassigned_payload),
        },
    )
