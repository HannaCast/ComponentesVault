from universities.models.academic_periods import AcademicPeriods
from universities.models.universities import Universities

# Se carga datos institucionales minimos para arrancar la generacion.
def load_university_context(university_id: int) -> dict:
    """Carga datos institucionales minimos para arrancar la generacion."""
    university = Universities.objects.filter(
        id=university_id,
        status=1,
        is_deleted=0,
    ).first()

    if university is None:
        raise ValueError('UNIVERSITY_NOT_FOUND')

    active_period = AcademicPeriods.objects.filter(
        university_id=university_id,
        is_active=1,
        is_deleted=0,
    ).values(
        'id',
        'name',
        'year',
        'order',
        'start_date',
        'end_date',
    ).first()

    active_period_id = active_period.get('id') if active_period else None

    return {
        'university_id': university_id,
        'start_time': university.start_time,
        'end_time': university.end_time,
        # Toma el comportamiento real configurado en la universidad.
        'uses_period_groups': bool(university.uses_period_groups),
        'active_period_id': active_period_id,
        'active_period': active_period,
    }
