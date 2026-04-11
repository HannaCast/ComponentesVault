from datetime import datetime

from schedule_generator.generation_logic.graph.models import TimeSlot

# Calcula penalizacion blanda: menor valor implica mejor opcion.
def compute_slot_penalty(
    group_id: int,
    slot: TimeSlot,
    group_day_load: dict[tuple[int, int], int],
    soft_weights: dict | None = None,
) -> float:
    """Calcula penalizacion blanda: menor valor implica mejor opcion."""
    weights = soft_weights or {}

    spread_weight = float(weights.get('spread_days_weight', 4.0))
    day_weight = float(weights.get('day_order_weight', 0.1))
    hour_weight = float(weights.get('hour_order_weight', 0.01))

    # Penaliza concentrar demasiadas clases del mismo grupo en un solo dia.
    existing_load = group_day_load.get((group_id, slot.day_of_week), 0)

    hour_value = (
        datetime.combine(datetime.today(), slot.start_time).hour
        + datetime.combine(datetime.today(), slot.start_time).minute / 60
    )

    # Mezcla balance semanal + preferencia por dias/horas tempranas.
    return (
        existing_load * spread_weight
        + slot.day_of_week * day_weight
        + hour_value * hour_weight
    )
