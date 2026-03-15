import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('universities', '0001_initial'),
        ('user_accounts', '0002_seed_initial_users'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='selected_university',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name='selected_users',
                related_query_name='selected_user',
                to='universities.universities',
            ),
        ),
    ]
