from datetime import datetime, timedelta, time

from schedule_generator.generation_logic.graph.models import TimeSlot

# Se construye rejilla de slots por dia dentro de un turno, con duracion y dias configurables.
def build_time_slots(
    shift_start: time,
    shift_end: time,
    allowed_days: list[int],
    slot_duration_minutes: int = 60,
) -> list[TimeSlot]:
    """Genera la rejilla de slots por dia dentro de un turno."""
    if slot_duration_minutes <= 0:
        slot_duration_minutes = 60

    normalized_days = []
    for day in allowed_days or []:
        try:
            normalized_day = int(day)
        except (TypeError, ValueError):
            continue

        if 1 <= normalized_day <= 7:
            normalized_days.append(normalized_day)

    unique_days = sorted(set(normalized_days))

    if not unique_days:
        return []

    slots = []
    delta = timedelta(minutes=slot_duration_minutes)

    for day in unique_days:
        current = datetime.combine(datetime.today(), shift_start)
        end_datetime = datetime.combine(datetime.today(), shift_end)

        # Se crean bloques consecutivos hasta llegar al final del turno.
        while current + delta <= end_datetime:
            start = current.time()
            end = (current + delta).time()
            slot_id = f'D{day}_{start.strftime("%H%M")}_{end.strftime("%H%M")}'

            slots.append(
                TimeSlot(
                    slot_id=slot_id,
                    day_of_week=day,
                    start_time=start,
                    end_time=end,
                )
            )
            current += delta

    return slots
