from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('universities', '0001_initial'),
        ('user_accounts', '0002_seed_initial_users'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.RemoveField(
                    model_name='userconfiguration',
                    name='selected_university_id',
                ),
                migrations.AddField(
                    model_name='userconfiguration',
                    name='selected_university',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to='universities.universities',
                    ),
                ),
            ],
        ),
    ]
