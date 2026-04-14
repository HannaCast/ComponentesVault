from .universities import UniversityCreate, UniversityList, UniversityDetail
from .period_types import PeriodTypesSelectView
from .academic_periods import AcademicPeriodListCreateView, AcademicPeriodDetailView, AcademicPeriodToggleStatusView
from .shifts import ShiftDetailView, ShiftListView
from .classroom_type_priorities import (
    UniversityClassroomTypePriorityDetailView,
    UniversityClassroomTypePriorityListCreateView,
)
from .full_universities import UniversityFullSetupUpdateView, UniversityFullSetupView
from .university_profile import UniversityProfileView