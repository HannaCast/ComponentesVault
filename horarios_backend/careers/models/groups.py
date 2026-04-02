from django.db import models
from universities.models.academic_periods import AcademicPeriods
from careers.models.careers import Careers
from universities.models.universities import Universities
from universities.models.shifts import Shifts

class Groups(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=45)
    career = models.ForeignKey(Careers, models.DO_NOTHING)
    period_number = models.IntegerField()
    letter = models.CharField(max_length=1)
    shift = models.ForeignKey(Shifts, models.DO_NOTHING)
    academic_period = models.ForeignKey(AcademicPeriods, models.DO_NOTHING, blank=True, null=True)
    university = models.ForeignKey(Universities, models.DO_NOTHING)
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'groups'