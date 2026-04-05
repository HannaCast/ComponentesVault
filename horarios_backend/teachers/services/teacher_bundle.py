"""Reemplazo atómico de disponibilidades y materias de un profesor (misma transacción que la vista)."""

from rest_framework import serializers

from subjects.models import Subjects
from teachers.models import TeacherAvailabilities, Teachers, TeachersSubjects


def replace_teacher_availabilities(teacher: Teachers, rows: list) -> None:
    TeacherAvailabilities.objects.filter(teacher_id=teacher.pk, is_deleted=0).update(is_deleted=1)
    to_create = []
    for r in rows:
        to_create.append(
            TeacherAvailabilities(
                teacher_id=teacher.pk,
                day_of_week=r['day_of_week'],
                start_time=r['start_time'],
                end_time=r['end_time'],
                is_available=1 if r['is_available'] else 0,
                is_deleted=0,
            )
        )
    if to_create:
        TeacherAvailabilities.objects.bulk_create(to_create)


def replace_teacher_subjects(teacher: Teachers, university_id: int, rows: list) -> None:
    TeachersSubjects.objects.filter(
        teachers_id=teacher.pk,
        subjects__university_id=university_id,
        is_deleted=0,
    ).update(is_deleted=1)

    seen = set()
    for row in rows:
        sid = row['subject_id']
        if sid in seen:
            continue
        seen.add(sid)

        subj = Subjects.objects.filter(
            pk=sid,
            university_id=university_id,
            is_deleted=0,
            status=1,
        ).first()
        if subj is None:
            raise serializers.ValidationError(
                {
                    'subjects': [
                        (
                            f'La materia con id {sid} no existe, no está activa '
                            f'o no pertenece a la universidad seleccionada.'
                        )
                    ]
                }
            )

        TeachersSubjects.objects.create(
            teachers_id=teacher.pk,
            subjects_id=sid,
            is_deleted=0,
        )
