from django.db import migrations


def create_user_configurations_if_missing(apps, schema_editor):
    connection = schema_editor.connection
    existing = {name.lower() for name in connection.introspection.table_names()}
    if 'user_configurations' not in existing:
        UserConfiguration = apps.get_model('user_accounts', 'UserConfiguration')
        schema_editor.create_model(UserConfiguration)
    # Si la tabla faltaba, 0002_seed no pudo insertar; si existía vacía, igual aseguramos filas.
    User = apps.get_model('user_accounts', 'User')
    UserConfiguration = apps.get_model('user_accounts', 'UserConfiguration')
    for user in User.objects.all():
        UserConfiguration.objects.get_or_create(
            user=user,
            defaults={
                'theme': 'light',
                'accent': 'blue',
                'status': 1,
            },
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    # MySQL no permite DDL (CREATE TABLE) dentro de transacciones con rollback.
    atomic = False

    dependencies = [
        ('user_accounts', '0003_selected_university_fk_in_user_configurations'),
    ]

    operations = [
        migrations.RunPython(create_user_configurations_if_missing, noop_reverse),
    ]
