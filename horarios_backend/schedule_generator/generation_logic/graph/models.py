from dataclasses import dataclass
from datetime import time


@dataclass(slots=True)
class TeacherAvailabilityBlock:
    day_of_week: int
    start: time
    end: time
    is_available: bool


@dataclass(slots=True)
class TeacherContext:
    teacher_id: int
    full_name: str
    require_classroom: bool
    availability: list[TeacherAvailabilityBlock]


@dataclass(slots=True)
class SubjectContext:
    career_subject_id: int
    subject_id: int
    subject_name: str
    hours_per_week: int
    color_hex: str
    contrast_hex: str


@dataclass(slots=True)
class GroupContext:
    group_id: int
    group_name: str
    career_id: int
    period_number: int
    shift_start: time
    shift_end: time
    modality_require_classroom: bool
    allowed_days: list[int]
    classroom_days_per_week: int
    career_name: str | None = None
    career_short_name: str | None = None
    career_code: str | None = None
    shift_id: int | None = None
    shift_name: str | None = None
    academic_period_id: int | None = None
    academic_period_name: str | None = None
    academic_period_year: int | None = None
    academic_period_order: int | None = None


@dataclass(slots=True)
class ClassroomCandidate:
    classroom_id: int
    name: str
    classroom_type_id: int
    is_restricted: bool
    allowed_career_ids: list[int]


@dataclass(slots=True)
class TimeSlot:
    slot_id: str
    day_of_week: int
    start_time: time
    end_time: time


@dataclass(slots=True)
class ScheduleNode:
    node_key: str
    group_id: int
    group_name: str
    career_id: int
    period_number: int
    subject_id: int
    subject_name: str
    allowed_slot_ids: set[str]
    teacher_candidates: list[TeacherContext]
    require_classroom: bool
    color_hex: str
    contrast_hex: str


@dataclass(slots=True)
class ScheduleAssignment:
    node_key: str
    slot_id: str
    day_of_week: int
    start_time: time
    end_time: time
    teacher_id: int | None
    teacher_name: str | None
    classroom_id: int | None
    classroom_name: str | None


@dataclass(slots=True)
class UnassignedNode:
    node_key: str
    reason: str


@dataclass(slots=True)
class DSaturResult:
    assignments: list[ScheduleAssignment]
    unassigned: list[UnassignedNode]
