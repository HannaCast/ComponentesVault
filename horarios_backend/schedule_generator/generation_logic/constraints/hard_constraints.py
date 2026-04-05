from schedule_generator.generation_logic.graph.models import (
    ClassroomCandidate,
    TeacherContext,
    TimeSlot,
)


def _overlaps(slot_start, slot_end, block_start, block_end) -> bool:
    """Retorna True cuando dos rangos de tiempo se traslapan."""
    return slot_start < block_end and slot_end > block_start

# Funciones de validación de restricciones duras para profesores y aulas.
def is_teacher_available_for_slot(teacher: TeacherContext, slot: TimeSlot) -> bool:
    """Evalua disponibilidad combinando bloques de no-disponible y disponible."""
    day_blocks = [
        block
        for block in teacher.availability
        if int(block.day_of_week) == int(slot.day_of_week)
    ]

    if not day_blocks:
        # Sin configuracion explicita se interpreta como disponible.
        return True

    # Los bloques marcados como no disponibles tienen prioridad de bloqueo.
    unavailable_blocks = [block for block in day_blocks if not block.is_available]
    if any(
        _overlaps(slot.start_time, slot.end_time, block.start, block.end)
        for block in unavailable_blocks
    ):
        return False

    # Si existen ventanas disponibles explicitas, el slot debe caber dentro de alguna.
    available_blocks = [block for block in day_blocks if block.is_available]
    if available_blocks:
        return any(
            block.start <= slot.start_time and block.end >= slot.end_time
            for block in available_blocks
        )

    return True

# La validación de aula se maneja en la función de selección, ya que depende de la carrera y el slot específico.
def can_use_teacher(teacher: TeacherContext, slot: TimeSlot, teacher_busy: set[tuple[int, str]]) -> bool:
    """Valida disponibilidad real y que el profesor no este ocupado en el slot."""
    if (teacher.teacher_id, slot.slot_id) in teacher_busy:
        return False

    return is_teacher_available_for_slot(teacher, slot)

# Validación de aula se maneja en la función de selección, ya que depende de la carrera y el slot específico.
def can_use_classroom(
    classroom: ClassroomCandidate,
    career_id: int,
    slot_id: str,
    classroom_busy: set[tuple[int, str]],
) -> bool:
    """Valida ocupacion de aula y reglas de restriccion por carrera."""
    if (classroom.classroom_id, slot_id) in classroom_busy:
        return False

    if not classroom.is_restricted:
        return True

    return career_id in classroom.allowed_career_ids
