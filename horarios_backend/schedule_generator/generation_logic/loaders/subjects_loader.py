from collections import defaultdict

from careers.models.career_subjects import CareerSubjects
from schedule_generator.generation_logic.graph.models import SubjectContext
from subjects.models import SubjectsClassroomTypes

# Se carga materias activas de una carrera/periodo con su metadata visual.
def load_subjects_for_group(career_id: int, period_number: int) -> list[SubjectContext]:
    """Carga materias activas de una carrera/periodo con su metadata visual."""
    rows = CareerSubjects.objects.select_related(
        'subjects',
        'subjects__color',
    ).filter(
        careers_id=career_id,
        period_number=period_number,
        is_deleted=0,
        subjects__status=1,
        subjects__is_deleted=0,
    ).order_by('subjects_id', 'id')

    subject_ids = sorted({int(row.subjects_id) for row in rows})
    classroom_type_map: dict[int, list[int]] = defaultdict(list)

    if subject_ids:
        for restriction in SubjectsClassroomTypes.objects.filter(
            subject_id__in=subject_ids,
            is_deleted=0,
            classroom_type__is_deleted=0,
            classroom_type__status=1,
        ).values('subject_id', 'classroom_type_id'):
            classroom_type_map[int(restriction['subject_id'])].append(
                int(restriction['classroom_type_id'])
            )

    result = []
    for row in rows:
        subject = row.subjects
        color = subject.color
        allowed_classroom_type_ids = sorted(
            set(classroom_type_map.get(subject.id, []))
        )

        result.append(
            SubjectContext(
                career_subject_id=row.id,
                subject_id=subject.id,
                subject_name=subject.name,
                # Se fuerza al menos 1 para evitar nodos sin carga horaria.
                hours_per_week=max(int(subject.hours_per_week or 0), 1),
                is_restricted_to_classroom_types=bool(subject.is_restricted_to_classroom_types),
                allowed_classroom_type_ids=allowed_classroom_type_ids,
                color_hex=color.hex if color else '3B82F6',
                contrast_hex=color.contrast_hex if color else 'FFFFFF',
            )
        )

    return result
