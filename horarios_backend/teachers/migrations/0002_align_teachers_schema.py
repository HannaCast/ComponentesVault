# Alinea teachers con modelos.txt / BD del equipo: surname, require_classroom, last_name opcional.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teachers', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='teachers',
            old_name='first_name',
            new_name='surname',
        ),
        migrations.RenameField(
            model_name='teachers',
            old_name='required_classroom',
            new_name='require_classroom',
        ),
        migrations.AlterField(
            model_name='teachers',
            name='name',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='teachers',
            name='last_name',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
