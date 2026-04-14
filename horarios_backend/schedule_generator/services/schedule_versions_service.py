from dataclasses import asdict
import secrets

from django.db import transaction
from django.utils import timezone

from schedule_generator.generation_logic.loaders import load_university_context
from schedule_generator.models import ScheduleVersions
from schedule_generator.services.schedule_generation_service import generate_schedule
from universities.models import AcademicPeriods
from user_accounts.models import UserConfiguration


def _safe_non_negative_int(value) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return 0
    return parsed if parsed >= 0 else 0


def _normalize_draft_university_ids(raw_ids) -> list[int]:
    if not isinstance(raw_ids, list):
        return []

    normalized = []
    for item in raw_ids:
        try:
            university_id = int(item)
        except (TypeError, ValueError):
            continue

        if university_id <= 0 or university_id in normalized:
            continue

        normalized.append(university_id)

    return normalized


def _normalize_schedule_generation_payload(payload) -> dict:
    normalized = dict(payload) if isinstance(payload, dict) else {}
    normalized['draft_schedule_university_ids'] = _normalize_draft_university_ids(
        normalized.get('draft_schedule_university_ids')
    )
    return normalized


def _normalize_boolean_parameter(value, *, default: bool) -> bool:
    if value is None:
        return default

    if isinstance(value, bool):
        return value

    if isinstance(value, int):
        return value != 0

    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {'true', '1', 'yes', 'si'}:
            return True
        if normalized in {'false', '0', 'no'}:
            return False

    return default


def _normalize_optional_non_negative_int_parameter(value) -> int | None:
    if value is None:
        return None

    if isinstance(value, bool):
        return None

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None

    if parsed < 0:
        return None

    return parsed


def _build_random_seed() -> int:
    # Se usa rango amplio positivo para facilitar interoperabilidad en serializacion JSON.
    return secrets.randbelow(2_147_483_647) + 1


def _get_or_create_user_configuration(user) -> UserConfiguration:
    user_config, _ = UserConfiguration.objects.get_or_create(
        user=user,
        defaults={
            'theme': 'light',
            'accent': 'blue',
            'schedule_generation': {
                'draft_schedule_university_ids': [],
            },
            'status': 1,
        },
    )

    normalized_payload = _normalize_schedule_generation_payload(user_config.schedule_generation)
    update_fields = []

    if user_config.schedule_generation != normalized_payload:
        user_config.schedule_generation = normalized_payload
        update_fields.append('schedule_generation')

    if user_config.status is None:
        user_config.status = 1
        update_fields.append('status')

    if update_fields:
        user_config.save(update_fields=update_fields)

    return user_config


def _set_draft_university_presence(user, university_id: int, should_exist: bool) -> None:
    user_config = _get_or_create_user_configuration(user)
    payload = _normalize_schedule_generation_payload(user_config.schedule_generation)
    draft_ids = payload['draft_schedule_university_ids']

    has_university = university_id in draft_ids
    if should_exist and not has_university:
        draft_ids.append(university_id)
    elif not should_exist and has_university:
        draft_ids = [value for value in draft_ids if value != university_id]
        payload['draft_schedule_university_ids'] = draft_ids
    else:
        return

    user_config.schedule_generation = payload
    user_config.save(update_fields=['schedule_generation'])


def _default_draft_label(now_dt) -> str:
    return f"Borrador {now_dt.strftime('%Y-%m-%d %H:%M')}"


def _build_parameters_payload(parameters: dict | None, *, uses_period_groups: bool) -> dict:
    payload = dict(parameters) if isinstance(parameters, dict) else {}
    payload['uses_period_groups'] = bool(uses_period_groups)
    payload['allow_multiple_teachers_per_group_subject'] = _normalize_boolean_parameter(
        payload.get('allow_multiple_teachers_per_group_subject'),
        default=False,
    )
    payload['randomize_generation'] = _normalize_boolean_parameter(
        payload.get('randomize_generation'),
        default=False,
    )
    payload['random_seed'] = _normalize_optional_non_negative_int_parameter(
        payload.get('random_seed')
    )
    return payload


def _resolve_academic_period(academic_period_id: int | None, university_id: int):
    if academic_period_id is None:
        return None

    academic_period = AcademicPeriods.objects.filter(
        id=academic_period_id,
        university_id=university_id,
        is_deleted=0,
    ).first()

    if academic_period is None:
        raise ValueError('ACADEMIC_PERIOD_NOT_FOUND')

    return academic_period


@transaction.atomic
def generate_or_update_draft_schedule_version(
    *,
    university_id: int,
    user,
    parameters: dict | None = None,
    is_confirmed_default: int = 0,
    is_deleted_default: int = 0,
):
    if not university_id:
        raise ValueError('NO_UNIVERSITY_SELECTED')

    now_dt = timezone.now()

    university_context = load_university_context(university_id)

    parameters_payload = _build_parameters_payload(
        parameters,
        uses_period_groups=bool(university_context.get('uses_period_groups', False)),
    )

    if parameters_payload.get('randomize_generation') and parameters_payload.get('random_seed') is None:
        parameters_payload['random_seed'] = _build_random_seed()

    result = generate_schedule(
        university_id=university_id,
        allow_multiple_teachers_per_group_subject=bool(
            parameters_payload.get('allow_multiple_teachers_per_group_subject', False)
        ),
        randomize_generation=bool(parameters_payload.get('randomize_generation', False)),
        random_seed=parameters_payload.get('random_seed'),
    )
    result_payload = asdict(result)

    summary = result_payload.get('summary') if isinstance(result_payload.get('summary'), dict) else {}
    assigned_count = _safe_non_negative_int(summary.get('total_blocks_assigned'))
    unassigned_count = _safe_non_negative_int(summary.get('total_blocks_unassigned'))

    context_active_period_id = university_context.get('active_period_id')
    academic_period = _resolve_academic_period(context_active_period_id, university_id)

    draft_queryset = (
        ScheduleVersions.objects
        .select_for_update()
        .filter(
            university_id=university_id,
            is_deleted=0,
            is_confirmed=0,
        )
        .order_by('-id')
    )

    draft = draft_queryset.first()

    if draft is None:
        draft = ScheduleVersions.objects.create(
            label=_default_draft_label(now_dt),
            university_id=university_id,
            academic_period=academic_period,
            parameters=parameters_payload,
            data=result_payload,
            assigned_count=assigned_count,
            unassigned_count=unassigned_count,
            is_confirmed=is_confirmed_default,
            confirmed_at=None,
            is_deleted=is_deleted_default,
        )
    else:
        duplicate_ids = list(draft_queryset.values_list('id', flat=True)[1:])
        if duplicate_ids:
            ScheduleVersions.objects.filter(id__in=duplicate_ids).update(
                is_deleted=1,
            )

        draft.academic_period = academic_period
        draft.parameters = parameters_payload
        draft.data = result_payload
        draft.assigned_count = assigned_count
        draft.unassigned_count = unassigned_count
        draft.save(
            update_fields=[
                'academic_period',
                'parameters',
                'data',
                'assigned_count',
                'unassigned_count',
            ]
        )

    _set_draft_university_presence(user, university_id, should_exist=True)
    return draft


@transaction.atomic
def update_draft_schedule_version(
    *,
    version_id: int,
    university_id: int,
    user,
    updates: dict,
):
    draft = (
        ScheduleVersions.objects
        .select_for_update()
        .filter(
            id=version_id,
            university_id=university_id,
            is_deleted=0,
            is_confirmed=0,
        )
        .first()
    )

    if draft is None:
        raise ValueError('DRAFT_NOT_FOUND')

    update_fields = []

    if 'label' in updates:
        draft.label = updates['label']
        update_fields.append('label')

    if 'academic_period_id' in updates:
        draft.academic_period = _resolve_academic_period(updates['academic_period_id'], university_id)
        update_fields.append('academic_period')

    if 'parameters' in updates:
        draft.parameters = _build_parameters_payload(
            updates['parameters'],
            uses_period_groups=bool(draft.university.uses_period_groups),
        )
        update_fields.append('parameters')

    if 'data' in updates:
        draft.data = updates['data']
        update_fields.append('data')

    if 'assigned_count' in updates:
        draft.assigned_count = updates['assigned_count']
        update_fields.append('assigned_count')

    if 'unassigned_count' in updates:
        draft.unassigned_count = updates['unassigned_count']
        update_fields.append('unassigned_count')

    if update_fields:
        draft.save(update_fields=update_fields)

    return draft


@transaction.atomic
def confirm_schedule_version(*, version_id: int, university_id: int, user):
    schedule_version = (
        ScheduleVersions.objects
        .select_for_update()
        .filter(
            id=version_id,
            university_id=university_id,
            is_deleted=0,
        )
        .first()
    )

    if schedule_version is None:
        raise ValueError('VERSION_NOT_FOUND')

    if schedule_version.is_confirmed != 1:
        schedule_version.is_confirmed = 1
        schedule_version.confirmed_at = timezone.now()
        schedule_version.save(update_fields=['is_confirmed', 'confirmed_at'])

    _set_draft_university_presence(user, university_id, should_exist=False)
    return schedule_version


@transaction.atomic
def delete_draft_schedule_version(*, version_id: int, university_id: int, user):
    draft = (
        ScheduleVersions.objects
        .select_for_update()
        .filter(
            id=version_id,
            university_id=university_id,
            is_deleted=0,
            is_confirmed=0,
        )
        .first()
    )

    if draft is None:
        raise ValueError('DRAFT_NOT_FOUND')

    draft.is_deleted = 1
    draft.save(update_fields=['is_deleted'])

    _set_draft_university_presence(user, university_id, should_exist=False)
    return draft


@transaction.atomic
def update_schedule_version_label(*, version_id: int, university_id: int, user, label: str):
    schedule_version = (
        ScheduleVersions.objects
        .select_for_update()
        .filter(
            id=version_id,
            university_id=university_id,
            is_deleted=0,
        )
        .first()
    )

    if schedule_version is None:
        raise ValueError('VERSION_NOT_FOUND')

    schedule_version.label = label
    schedule_version.save(update_fields=['label'])

    return schedule_version


def get_schedule_version_by_id(*, version_id: int, university_id: int):
    return (
        ScheduleVersions.objects
        .filter(
            id=version_id,
            university_id=university_id,
            is_deleted=0,
        )
        .select_related('academic_period')
        .first()
    )


def get_schedule_versions_queryset(*, university_id: int):
    return (
        ScheduleVersions.objects
        .filter(
            university_id=university_id,
            is_deleted=0,
        )
        .select_related('academic_period')
        .order_by('-created_at', '-id')
    )
