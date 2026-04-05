from careers.models.career_subjects import CareerSubjects
from schedule_generator.graph.models import SubjectContext

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

    result = []
    for row in rows:
        subject = row.subjects
        color = subject.color

        result.append(
            SubjectContext(
                career_subject_id=row.id,
                subject_id=subject.id,
                subject_name=subject.name,
                # Se fuerza al menos 1 para evitar nodos sin carga horaria.
                hours_per_week=max(int(subject.hours_per_week or 0), 1),
                color_hex=color.hex if color else '3B82F6',
                contrast_hex=color.contrast_hex if color else 'FFFFFF',
            )
        )

    return result
