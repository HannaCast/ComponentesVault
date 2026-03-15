from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from universities.models.universities import Universities


class Role(models.Model):
    name = models.CharField(max_length=45)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'roles'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    id         = models.AutoField(primary_key=True)
    name       = models.CharField(max_length=100)
    surname    = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100, blank=True, null=True)
    email      = models.EmailField(max_length=100, unique=True)
    status     = models.IntegerField(default=1)
    role       = models.ForeignKey(Role, on_delete=models.DO_NOTHING, null=True, blank=True)
    selected_university = models.ForeignKey(
        Universities,
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
        related_name='selected_users',
        related_query_name='selected_user',
    )
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name', 'surname']

    class Meta:
        managed = True
        db_table = 'users'