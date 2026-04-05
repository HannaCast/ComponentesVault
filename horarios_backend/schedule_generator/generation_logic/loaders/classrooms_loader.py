from collections import defaultdict

from classrooms.models import ClassroomCareers, Classrooms
from schedule_generator.generation_logic.graph.models import ClassroomCandidate

# Se carga aulas activas y sus restricciones por carrera.
def load_classrooms_for_university(university_id: int) -> list[ClassroomCandidate]:
    """Carga aulas activas y sus restricciones por carrera."""
    classroom_rows = list(
        Classrooms.objects.filter(
            universities_id=university_id,
            status=1,
            is_deleted=0,
        ).values('id', 'name', 'classroom_type_id', 'is_restricted')
    )

    if not classroom_rows:
        return []

    classroom_ids = [row['id'] for row in classroom_rows]

    # Map classrooms_id -> carreras permitidas para aulas restringidas.
    career_map: dict[int, list[int]] = defaultdict(list)
    for row in ClassroomCareers.objects.filter(
        classrooms_id__in=classroom_ids,
        is_deleted=0,
    ).values('classrooms_id', 'careers_id'):
        career_map[int(row['classrooms_id'])].append(int(row['careers_id']))

    # Se construye resultado final con datos de aulas y sus carreras permitidas.
    result = []
    for row in classroom_rows:
        classroom_id = int(row['id'])
        allowed_career_ids = sorted(set(career_map.get(classroom_id, [])))

        result.append(
            ClassroomCandidate(
                classroom_id=classroom_id,
                name=row['name'],
                classroom_type_id=int(row['classroom_type_id']),
                is_restricted=bool(row['is_restricted']),
                allowed_career_ids=allowed_career_ids,
            )
        )

    return result
