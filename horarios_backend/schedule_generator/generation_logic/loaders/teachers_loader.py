from collections import defaultdict

from schedule_generator.generation_logic.graph.models import (
    TeacherAvailabilityBlock,
    TeacherContext,
)
from teachers.models.teacher_availabilities import TeacherAvailabilities
from teachers.models.teacher_universities import TeachersUniversities
from teachers.models.teachers import Teachers
from teachers.models.teachers_subjects import TeachersSubjects


def _build_teacher_full_name(teacher: Teachers) -> str:
    parts = [teacher.name, teacher.surname]
    if teacher.last_name:
        parts.append(teacher.last_name)
    return ' '.join(parts)

# Resuelve profesores elegibles por materia y su disponibilidad semanal.
def load_teachers_for_subject(subject_id: int, university_id: int) -> list[TeacherContext]:
    """Resuelve profesores elegibles por materia y su disponibilidad semanal."""
    # 1) Profesores ligados a la materia.
    linked_teacher_ids = list(
        TeachersSubjects.objects.filter(
            subjects_id=subject_id,
            is_deleted=0,
        ).values_list('teachers_id', flat=True).distinct()
    )

    if not linked_teacher_ids:
        return []

    # 2) Interseccion con profesores habilitados en la universidad actual.
    allowed_teacher_ids = list(
        TeachersUniversities.objects.filter(
            teachers_id__in=linked_teacher_ids,
            universities_id=university_id,
            status=1,
            is_deleted=0,
        ).values_list('teachers_id', flat=True).distinct()
    )

    if not allowed_teacher_ids:
        return []

    # 3) Perfil base de profesores activos.
    teachers = Teachers.objects.filter(
        id__in=allowed_teacher_ids,
        status=1,
        is_deleted=0,
    ).order_by('id')

    availability_rows = TeacherAvailabilities.objects.filter(
        teacher_id__in=allowed_teacher_ids,
        is_deleted=0,
    ).values(
        'teacher_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_available',
    )

    # 4) Agrupar bloques de disponibilidad por profesor para evaluacion rapida.
    availability_map: dict[int, list[TeacherAvailabilityBlock]] = defaultdict(list)
    for row in availability_rows:
        availability_map[int(row['teacher_id'])].append(
            TeacherAvailabilityBlock(
                day_of_week=int(row['day_of_week']),
                start=row['start_time'],
                end=row['end_time'],
                is_available=bool(row['is_available']),
            )
        )

    return [
        TeacherContext(
            teacher_id=teacher.id,
            full_name=_build_teacher_full_name(teacher),
            require_classroom=bool(teacher.require_classroom),
            availability=availability_map.get(teacher.id, []),
        )
        for teacher in teachers
    ]
