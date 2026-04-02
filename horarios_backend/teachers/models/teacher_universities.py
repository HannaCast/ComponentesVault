from django.db import models
from horarios_backend.universities.models.universities import Universities
from teachers.models.teachers import Teachers

class TeachersUniversities(models.Model):
    id = models.IntegerField(primary_key=True)
    teachers = models.ForeignKey(Teachers, models.DO_NOTHING)
    universities = models.ForeignKey(Universities, models.DO_NOTHING)
    status = models.IntegerField()
    is_deleted = models.IntegerField()
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True 
        db_table = 'teachers_universities'