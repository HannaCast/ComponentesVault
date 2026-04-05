import json

from careers.models.career_period_exceptions import CareerPeriodExceptions
from careers.models.groups import Groups
from schedule_generator.graph.models import GroupContext


def _normalize_allowed_days(allowed_days) -> list[int]:
    """Normaliza allowed_days al rango 1..7 y aplica fallback laboral (L-V)."""
    if not isinstance(allowed_days, list):
        return [1, 2, 3, 4, 5]

    normalized = []
    for day in allowed_days:
        try:
            normalized_day = int(day)
        except (TypeError, ValueError):
            continue

        if 1 <= normalized_day <= 7:
            normalized.append(normalized_day)

    unique_days = sorted(set(normalized))
    return unique_days or [1, 2, 3, 4, 5]

# Se carga grupos activos, filtrando excepciones de carrera/periodo.
def load_active_groups(
    university_id: int,
    active_period_id: int | None,
    uses_period_groups: bool,
) -> list[GroupContext]:
    """Retorna grupos activos, filtrando excepciones de carrera/periodo."""
    if uses_period_groups and active_period_id is None:
        raise ValueError('NO_ACTIVE_PERIOD')

    # Se filtran relaciones base activas para evitar nodos invalidos desde origen.
    queryset = Groups.objects.select_related(
        'shift',
        'career',
        'career__modality',
    ).filter(
        university_id=university_id,
        status=1,
        is_deleted=0,
        career__status=1,
        career__is_deleted=0,
        shift__status=1,
        shift__is_deleted=0,
    )

    # Si la universidad segmenta por periodos, se filtran grupos del periodo activo.
    if uses_period_groups:
        queryset = queryset.filter(academic_period_id=active_period_id)

    # Estas combinaciones no deben generar horario por regla academica.
    exceptions = set(
        CareerPeriodExceptions.objects.filter(
            status=1,
            is_deleted=0,
            career__university_id=university_id,
        ).values_list('career_id', 'period_number')
    )

    result = []
    for group in queryset:
        if (group.career_id, group.period_number) in exceptions:
            continue

        modality = group.career.modality
        configurations = modality.configurations or {}

        if isinstance(configurations, str):
            try:
                configurations = json.loads(configurations)
            except (TypeError, ValueError, json.JSONDecodeError):
                configurations = {}

        # allowed_days controla los dias habilitados para esta modalidad.
        allowed_days = _normalize_allowed_days(configurations.get('allowed_days'))

        # classroom_days_per_week queda disponible para futuras heuristicas.
        classroom_days_per_week = configurations.get('classroom_days_per_week')
        if not isinstance(classroom_days_per_week, int) or classroom_days_per_week < 1:
            classroom_days_per_week = len(allowed_days)

        result.append(
            GroupContext(
                group_id=group.id,
                group_name=group.name,
                career_id=group.career_id,
                period_number=group.period_number,
                shift_start=group.shift.start_time,
                shift_end=group.shift.end_time,
                modality_require_classroom=bool(modality.require_classroom),
                allowed_days=allowed_days,
                classroom_days_per_week=classroom_days_per_week,
            )
        )

    return result
