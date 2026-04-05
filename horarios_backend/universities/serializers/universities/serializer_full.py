from rest_framework import serializers

from .university_write_serializer import UniversityWriteSerializer
from careers.serializers.modalities import ModalitiesWriteSerializer
from universities.serializers.academic_periods import AcademicPeriodWriteSerializer
from universities.serializers.shifts import ShiftWriteSerializer


class FullSetupSerializer(serializers.Serializer):
    university = serializers.DictField()
    modalities = serializers.ListField(child=serializers.DictField())
    academic_periods = serializers.ListField(required=False, child=serializers.DictField())
    shifts = serializers.ListField(child=serializers.DictField())