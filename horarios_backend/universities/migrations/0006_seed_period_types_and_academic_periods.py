from django.db import migrations


SEED_MARKER = 'migration_0006_seed'


def _table_exists(cursor, table_name: str) -> bool:
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = %s
        """,
        [table_name],
    )
    return cursor.fetchone()[0] > 0


def seed_period_types_and_academic_periods(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        if not _table_exists(cursor, 'period_types'):
            return

        period_rows = [
            ('Cuatrimestre', 'CUAT', 4),
            ('Semestre', 'SEM', 6),
            ('Anual', 'ANUAL', 12),
        ]
        for name, code, months in period_rows:
            cursor.execute(
                'SELECT id FROM period_types WHERE code = %s LIMIT 1',
                [code],
            )
            if cursor.fetchone():
                continue
            cursor.execute(
                """
                INSERT INTO period_types
                    (name, code, months_duration, status, created_by)
                VALUES (%s, %s, %s, %s, %s)
                """,
                [name, code, months, 1, SEED_MARKER],
            )

        if not _table_exists(cursor, 'academic_periods'):
            return
        if not _table_exists(cursor, 'universities'):
            return

        cursor.execute(
            """
            SELECT id FROM universities
            WHERE COALESCE(is_deleted, 0) = 0
            """
        )
        university_ids = [row[0] for row in cursor.fetchall()]

        for university_id in university_ids:
            cursor.execute(
                """
                SELECT COUNT(*) FROM academic_periods
                WHERE university_id = %s AND COALESCE(is_deleted, 0) = 0
                """,
                [university_id],
            )
            if cursor.fetchone()[0] > 0:
                continue

            periods = [
                (
                    'Mayo - Agosto 2026',
                    5,
                    8,
                    2026,
                    1,
                    1,
                ),
                (
                    'Septiembre - Diciembre 2026',
                    9,
                    12,
                    2026,
                    2,
                    0,
                ),
            ]
            for name, start_m, end_m, year, order_val, is_active in periods:
                cursor.execute(
                    """
                    INSERT INTO academic_periods (
                        name, university_id, start_month, end_month,
                        year, `order`, is_active, is_deleted, created_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    [
                        name,
                        university_id,
                        start_m,
                        end_m,
                        year,
                        order_val,
                        is_active,
                        0,
                        SEED_MARKER,
                    ],
                )


def reverse_seed(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        if _table_exists(cursor, 'academic_periods'):
            cursor.execute(
                'DELETE FROM academic_periods WHERE created_by = %s',
                [SEED_MARKER],
            )
        if _table_exists(cursor, 'period_types'):
            cursor.execute(
                'DELETE FROM period_types WHERE created_by = %s',
                [SEED_MARKER],
            )


class Migration(migrations.Migration):

    dependencies = [
        ('universities', '0005_alter_academicperiods_options'),
    ]

    operations = [
        migrations.RunPython(
            seed_period_types_and_academic_periods,
            reverse_seed,
        ),
    ]
