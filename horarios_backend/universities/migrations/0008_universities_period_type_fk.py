import django.db.models.deletion
from django.db import migrations, models


SEED_MARKER = 'migration_0008_period_type_backfill'


def fill_missing_university_period_type(apps, schema_editor):
    PeriodTypes = apps.get_model('universities', 'PeriodTypes')
    Universities = apps.get_model('universities', 'Universities')

    period_type = PeriodTypes.objects.filter(code='CUAT').order_by('id').first()
    if period_type is None:
        period_type = PeriodTypes.objects.order_by('id').first()

    if period_type is None:
        period_type = PeriodTypes.objects.create(
            name='Cuatrimestre',
            code='CUAT',
            months_duration=4,
            status=1,
            created_by=SEED_MARKER,
        )

    Universities.objects.filter(period_type__isnull=True).update(period_type_id=period_type.id)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('universities', '0007_images_universities_uses_period_groups_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='universities',
            name='period_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                to='universities.periodtypes',
            ),
        ),
        migrations.RunPython(fill_missing_university_period_type, noop_reverse),
        migrations.AlterField(
            model_name='universities',
            name='period_type',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.DO_NOTHING,
                to='universities.periodtypes',
            ),
        ),
    ]
