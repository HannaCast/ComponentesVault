from django.db.models import Count

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from careers.models import Careers, Groups
from classrooms.models import Classrooms
from core.api_response import ApiResponse
from core.permissions import RequireSelectedUniversity
from schedule_generator.models import ScheduleVersions
from subjects.models import Subjects
from teachers.models import TeacherAvailabilities, TeachersUniversities
from user_accounts.models import UserConfiguration
from universities.models import AcademicPeriods, Universities


def _normalize_draft_university_ids(raw_ids):
    if not isinstance(raw_ids, list):
        return []

    normalized_ids = []
    for value in raw_ids:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            continue

        if parsed <= 0 or parsed in normalized_ids:
            continue

        normalized_ids.append(parsed)

    return normalized_ids


def _apply_active_period_scope_if_needed(queryset, university):
    if int(university.uses_period_groups or 0) != 1:
        return queryset, False

    return queryset.filter(
        academic_period__is_deleted=0,
        academic_period__is_active=1,
        academic_period__university_id=university.id,
    ), True


def _build_completion_payload(*, careers_total, subjects_total, groups_total, teachers_active, teachers_with_availability, classrooms_total):
    completion_items = [
        {
            'key': 'careers',
            'label': 'Carreras',
            'current': careers_total,
            'target': 1,
            'is_complete': careers_total > 0,
            'hint': 'Registra al menos una carrera activa en tu contexto.',
        },
        {
            'key': 'subjects',
            'label': 'Materias',
            'current': subjects_total,
            'target': 1,
            'is_complete': subjects_total > 0,
            'hint': 'Agrega materias para alimentar la generacion de horario.',
        },
        {
            'key': 'groups',
            'label': 'Grupos',
            'current': groups_total,
            'target': 1,
            'is_complete': groups_total > 0,
            'hint': 'Crea grupos por periodo para completar la matriz academica.',
        },
        {
            'key': 'teachers',
            'label': 'Profesores activos',
            'current': teachers_active,
            'target': 1,
            'is_complete': teachers_active > 0,
            'hint': 'Debes tener profesores activos vinculados a la universidad.',
        },
        {
            'key': 'teacher_availability',
            'label': 'Disponibilidad de profesores',
            'current': teachers_with_availability,
            'target': teachers_active if teachers_active > 0 else 1,
            'is_complete': teachers_active > 0 and teachers_with_availability >= teachers_active,
            'hint': 'Cada profesor activo debe tener al menos un bloque disponible.',
        },
        {
            'key': 'classrooms',
            'label': 'Aulas',
            'current': classrooms_total,
            'target': 1,
            'is_complete': classrooms_total > 0,
            'hint': 'Registra aulas para habilitar asignaciones fisicas en el horario.',
        },
    ]

    total_modules = len(completion_items)
    completed_modules = sum(1 for item in completion_items if item['is_complete'])
    score_percentage = round((completed_modules / total_modules) * 100) if total_modules else 0

    return {
        'score_percentage': score_percentage,
        'completed_modules': completed_modules,
        'total_modules': total_modules,
        'items': completion_items,
    }


@extend_schema(tags=['Users'])
class UniversityDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, RequireSelectedUniversity]

    @extend_schema(
        summary='Resumen operativo del dashboard por universidad seleccionada',
        description=(
            'Entrega datos consolidados para el dashboard del usuario: contexto de universidad, '
            'estado de borrador de horario, conteos operativos y avance de completitud.'
        ),
    )
    def get(self, request):
        selected_university_id = request.selected_university_id

        university = Universities.objects.filter(
            id=selected_university_id,
            user=request.user,
            is_deleted=0,
        ).only('id', 'name', 'short_name', 'uses_period_groups').first()

        if university is None:
            return ApiResponse.not_found('Universidad seleccionada no encontrada')

        active_period = None
        if int(university.uses_period_groups or 0) == 1:
            active_period = AcademicPeriods.objects.filter(
                university_id=selected_university_id,
                is_active=1,
                is_deleted=0,
            ).only('id', 'name').order_by('-id').first()

        careers_queryset = Careers.objects.filter(
            university_id=selected_university_id,
            is_deleted=0,
        )
        careers_total = careers_queryset.count()
        careers_active = careers_queryset.filter(status=1).count()

        subjects_queryset = Subjects.objects.filter(
            university_id=selected_university_id,
            is_deleted=0,
        )
        subjects_total = subjects_queryset.count()
        subjects_active = subjects_queryset.filter(status=1).count()

        groups_queryset = Groups.objects.filter(
            university_id=selected_university_id,
            is_deleted=0,
        )
        groups_queryset, groups_scoped_to_active_period = _apply_active_period_scope_if_needed(
            groups_queryset,
            university,
        )
        groups_total = groups_queryset.count()
        groups_active = groups_queryset.filter(status=1).count()

        classrooms_queryset = Classrooms.objects.filter(
            universities_id=selected_university_id,
            is_deleted=0,
        )
        classrooms_total = classrooms_queryset.count()
        classrooms_active = classrooms_queryset.filter(status=1).count()

        teachers_links_queryset = TeachersUniversities.objects.filter(
            universities_id=selected_university_id,
            is_deleted=0,
            teachers__is_deleted=0,
        )
        teachers_total = teachers_links_queryset.values('teachers_id').distinct().count()

        active_teachers_queryset = teachers_links_queryset.filter(
            status=1,
            teachers__status=1,
        )
        teachers_active = active_teachers_queryset.values('teachers_id').distinct().count()
        active_teacher_ids = active_teachers_queryset.values_list('teachers_id', flat=True).distinct()

        teachers_with_availability = (
            TeacherAvailabilities.objects
            .filter(
                teacher_id__in=active_teacher_ids,
                is_deleted=0,
                is_available=1,
            )
            .values('teacher_id')
            .annotate(total=Count('id'))
            .count()
        )
        teachers_without_availability = max(teachers_active - teachers_with_availability, 0)

        schedule_generation_payload = {}
        user_config = (
            UserConfiguration.objects
            .filter(user=request.user)
            .order_by('-id')
            .only('schedule_generation')
            .first()
        )
        if user_config and isinstance(user_config.schedule_generation, dict):
            schedule_generation_payload = user_config.schedule_generation

        normalized_draft_university_ids = _normalize_draft_university_ids(
            schedule_generation_payload.get('draft_schedule_university_ids')
        )
        has_draft_from_configuration = selected_university_id in normalized_draft_university_ids

        draft_version = (
            ScheduleVersions.objects
            .filter(
                university_id=selected_university_id,
                is_deleted=0,
                is_confirmed=0,
            )
            .only('id', 'label', 'created_at')
            .order_by('-id')
            .first()
        )
        has_draft = bool(draft_version) or has_draft_from_configuration

        completion_payload = _build_completion_payload(
            careers_total=careers_total,
            subjects_total=subjects_total,
            groups_total=groups_total,
            teachers_active=teachers_active,
            teachers_with_availability=teachers_with_availability,
            classrooms_total=classrooms_total,
        )

        return ApiResponse.success(
            data={
                'university': {
                    'id': university.id,
                    'name': university.name,
                    'short_name': university.short_name,
                    'uses_period_groups': int(university.uses_period_groups or 0) == 1,
                    'active_period_name': active_period.name if active_period else None,
                },
                'schedule_generation': {
                    'has_draft': has_draft,
                    'draft_version_id': draft_version.id if draft_version else None,
                    'draft_version_label': draft_version.label if draft_version else None,
                    'draft_created_at': (
                        draft_version.created_at.isoformat()
                        if draft_version and draft_version.created_at
                        else None
                    ),
                    'draft_origin': (
                        'schedule_versions'
                        if draft_version
                        else ('user_configuration' if has_draft_from_configuration else None)
                    ),
                },
                'counts': {
                    'careers': {'total': careers_total, 'active': careers_active},
                    'subjects': {'total': subjects_total, 'active': subjects_active},
                    'groups': {
                        'total': groups_total,
                        'active': groups_active,
                        'scoped_to_active_period': groups_scoped_to_active_period,
                    },
                    'teachers': {
                        'total': teachers_total,
                        'active': teachers_active,
                        'with_availability': teachers_with_availability,
                        'without_availability': teachers_without_availability,
                    },
                    'classrooms': {'total': classrooms_total, 'active': classrooms_active},
                },
                'completion': completion_payload,
            }
        )
