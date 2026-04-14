from .universities import UniversityWriteSerializer
from .period_types import PeriodTypeSelectSerializer
from .academic_periods import (
    AcademicPeriodDetailSerializer,
    AcademicPeriodListSerializer,
    AcademicPeriodWriteSerializer,
)
from .shifts import ShiftWriteSerializer, ShiftDetailSerializer, ShiftListSerializer
from .classroom_type_priorities import (
    UniversityClassroomTypePriorityDetailSerializer,
    UniversityClassroomTypePriorityListSerializer,
    UniversityClassroomTypePriorityWriteSerializer,
)
from .universities.serializer_full import FullSetupSerializer
from .images.image_serializer import UploadImageSerializer