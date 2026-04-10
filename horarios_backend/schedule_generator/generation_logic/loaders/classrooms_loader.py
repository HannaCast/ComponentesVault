from collections import defaultdict

from classrooms.models import ClassroomCareers, ClassroomSubjects, Classrooms
from schedule_generator.generation_logic.graph.models import ClassroomCandidate

# Se carga aulas activas y sus restricciones por carrera.
def load_classrooms_for_university(university_id: int) -> list[ClassroomCandidate]:
    """Carga aulas activas y sus restricciones por carrera."""
    classroom_rows = list(
        Classrooms.objects.filter(
            universities_id=university_id,
            status=1,
            is_deleted=0,
        ).values(
            'id',
            'name',
            'classroom_type_id',
            'is_restricted',
            'is_restricted_to_subjects',
        )
    )

    if not classroom_rows:
        return []

    classroom_ids = [row['id'] for row in classroom_rows]

    # Map classrooms_id -> carreras permitidas para aulas restringidas.
    career_map: dict[int, list[int]] = defaultdict(list)
    for row in ClassroomCareers.objects.filter(
        classrooms_id__in=classroom_ids,
        is_deleted=0,
        careers__is_deleted=0,
        careers__status=1,
    ).values('classrooms_id', 'careers_id'):
        career_map[int(row['classrooms_id'])].append(int(row['careers_id']))

    # Map classroom_id -> materias permitidas para aulas restringidas por materia.
    subject_map: dict[int, list[int]] = defaultdict(list)
    for row in ClassroomSubjects.objects.filter(
        classroom_id__in=classroom_ids,
        is_deleted=0,
        subject__is_deleted=0,
        subject__status=1,
    ).values('classroom_id', 'subject_id'):
        subject_map[int(row['classroom_id'])].append(int(row['subject_id']))

    # Se construye resultado final con datos de aulas y sus carreras permitidas.
    result = []
    for row in classroom_rows:
        classroom_id = int(row['id'])
        allowed_career_ids = sorted(set(career_map.get(classroom_id, [])))
        allowed_subject_ids = sorted(set(subject_map.get(classroom_id, [])))

        result.append(
            ClassroomCandidate(
                classroom_id=classroom_id,
                name=row['name'],
                classroom_type_id=int(row['classroom_type_id']),
                is_restricted=bool(row['is_restricted']),
                allowed_career_ids=allowed_career_ids,
                is_restricted_to_subjects=bool(row['is_restricted_to_subjects']),
                allowed_subject_ids=allowed_subject_ids,
            )
        )

    return result
