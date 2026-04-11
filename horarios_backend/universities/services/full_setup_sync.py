"""
Sincronización de modalidades, periodos académicos y turnos para el setup
completo de universidad (creación y actualización).
"""
from __future__ import annotations

from typing import Any

from django.utils import timezone
from rest_framework import serializers

from careers.models import Modalities
from careers.serializers.modalities import ModalitiesWriteSerializer
from universities.models import AcademicPeriods, Shifts, Universities
from universities.serializers.academic_periods import AcademicPeriodWriteSerializer
from universities.serializers.shifts import ShiftWriteSerializer


def _uses_period_groups(university: Universities) -> bool:
    return int(university.uses_period_groups or 0) == 1


def create_modalities_shifts_periods(
    *,
    request,
    university_id: int,
    data: dict[str, Any],
) -> None:
    """Crea modalidades, periodos y turnos tras insertar la universidad (POST)."""
    for modality_data in data['modalities']:
        modality_serializer = ModalitiesWriteSerializer(
            data=modality_data,
            context={'selected_university_id': university_id},
        )
        modality_serializer.is_valid(raise_exception=True)
        modality_serializer.save()

    for period_data in data.get('academic_periods', []):
        period_serializer = AcademicPeriodWriteSerializer(
            data=period_data,
            context={'selected_university_id': university_id},
        )
        period_serializer.is_valid(raise_exception=True)
        period_serializer.save()

    for shift_data in data['shifts']:
        shift_serializer = ShiftWriteSerializer(
            data=shift_data,
            context={'selected_university_id': university_id},
        )
        shift_serializer.is_valid(raise_exception=True)
        shift_serializer.save()


def update_university_core(*, request, university: Universities, university_data: dict) -> None:
    from universities.serializers import UniversityWriteSerializer

    ser = UniversityWriteSerializer(
        university,
        data=university_data,
        partial=True,
    )
    ser.is_valid(raise_exception=True)
    ser.save(
        updated_at=timezone.now(),
        updated_by=request.user.get_username(),
    )


def sync_modalities(*, university_id: int, modalities_payload: list) -> None:
    desired: set[int] = set()
    for raw in modalities_payload:
        row = dict(raw)
        pk = row.pop('id', None)
        if pk is not None:
            try:
                pk = int(pk)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'modalities': 'Cada modalidad con id debe tener un identificador numérico válido.'}
                )

        if pk:
            instance = Modalities.objects.filter(pk=pk, university_id=university_id).first()
            if instance is None:
                raise serializers.ValidationError(
                    {'modalities': f'La modalidad id={pk} no existe o no pertenece a esta universidad.'}
                )
            ser = ModalitiesWriteSerializer(
                instance,
                data=row,
                context={'selected_university_id': university_id},
            )
            ser.is_valid(raise_exception=True)
            m = ser.save()
            if m.status != 1:
                m.status = 1
                m.save(update_fields=['status'])
            desired.add(m.pk)
        else:
            ser = ModalitiesWriteSerializer(
                data=row,
                context={'selected_university_id': university_id},
            )
            ser.is_valid(raise_exception=True)
            m = ser.save()
            desired.add(m.pk)

    Modalities.objects.filter(university_id=university_id, status=1).exclude(pk__in=desired).update(
        status=0
    )


def sync_shifts(*, university_id: int, shifts_payload: list) -> None:
    desired: set[int] = set()
    for raw in shifts_payload:
        row = dict(raw)
        pk = row.pop('id', None)
        if pk is not None:
            try:
                pk = int(pk)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {'shifts': 'Cada turno con id debe tener un identificador numérico válido.'}
                )

        if pk:
            instance = Shifts.objects.filter(
                pk=pk,
                university_id=university_id,
                is_deleted=0,
            ).first()
            if instance is None:
                raise serializers.ValidationError(
                    {'shifts': f'El turno id={pk} no existe o no pertenece a esta universidad.'}
                )
            ser = ShiftWriteSerializer(
                instance,
                data=row,
                context={'selected_university_id': university_id},
            )
            ser.is_valid(raise_exception=True)
            s = ser.save()
            desired.add(s.pk)
        else:
            ser = ShiftWriteSerializer(
                data=row,
                context={'selected_university_id': university_id},
            )
            ser.is_valid(raise_exception=True)
            s = ser.save()
            desired.add(s.pk)

    Shifts.objects.filter(university_id=university_id, is_deleted=0).exclude(pk__in=desired).update(
        is_deleted=1
    )


def sync_academic_periods(
    *,
    university_id: int,
    university: Universities,
    periods_payload: list | None,
) -> None:
    if not _uses_period_groups(university):
        AcademicPeriods.objects.filter(university_id=university_id, is_deleted=0).update(is_deleted=1)
        return

    desired: set[int] = set()
    for raw in periods_payload or []:
        row = dict(raw)
        pk = row.pop('id', None)
        if pk is not None:
            try:
                pk = int(pk)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {
                        'academic_periods': (
                            'Cada periodo con id debe tener un identificador numérico válido.'
                        )
                    }
                )

        if pk:
            instance = AcademicPeriods.objects.filter(
                pk=pk,
                university_id=university_id,
                is_deleted=0,
            ).first()
            if instance is None:
                raise serializers.ValidationError(
                    {
                        'academic_periods': (
                            f'El periodo id={pk} no existe o no pertenece a esta universidad.'
                        )
                    }
                )
            ser = AcademicPeriodWriteSerializer(
                instance,
                data=row,
                context={'selected_university_id': university_id},
            )
            ser.is_valid(raise_exception=True)
            p = ser.save()
            desired.add(p.pk)
        else:
            ser = AcademicPeriodWriteSerializer(
                data=row,
                context={'selected_university_id': university_id},
            )
            ser.is_valid(raise_exception=True)
            p = ser.save()
            desired.add(p.pk)

    AcademicPeriods.objects.filter(university_id=university_id, is_deleted=0).exclude(
        pk__in=desired
    ).update(is_deleted=1)


def update_full_setup(*, request, university: Universities, data: dict[str, Any]) -> int:
    """
    Actualiza universidad y sincroniza hijos. Debe ejecutarse dentro de transaction.atomic.
    """
    university_id = university.id
    update_university_core(
        request=request,
        university=university,
        university_data=data['university'],
    )
    university.refresh_from_db()

    sync_modalities(university_id=university_id, modalities_payload=data['modalities'])
    sync_academic_periods(
        university_id=university_id,
        university=university,
        periods_payload=data.get('academic_periods'),
    )
    sync_shifts(university_id=university_id, shifts_payload=data['shifts'])

    return university_id
