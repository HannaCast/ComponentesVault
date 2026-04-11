from django.db import migrations, models


def _default_schedule_generation_payload():
    return {
        'draft_schedule_university_ids': [],
    }


class Migration(migrations.Migration):

    dependencies = [
        ('user_accounts', '0004_ensure_user_configurations_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='userconfiguration',
            name='schedule_generation',
            field=models.JSONField(default=_default_schedule_generation_payload),
            preserve_default=False,
        ),
    ]
