from django.db import migrations


def seed_utez_selected_university(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email IN ('usuario@gmail.com', 'admin@gmail.com')
            ORDER BY CASE WHEN email = 'usuario@gmail.com' THEN 0 ELSE 1 END
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        if not row:
            return

        user_id = row[0]

        cursor.execute("SHOW COLUMNS FROM universities")
        university_columns = {col[0] for col in cursor.fetchall()}

        cursor.execute(
            """
            SELECT id
            FROM universities
            WHERE short_name = %s
            LIMIT 1
            """,
            ['UTEZ'],
        )
        row = cursor.fetchone()

        if row:
            university_id = row[0]
        else:
            insert_columns = [
                'name',
                'short_name',
                'institution_code',
                'user_id',
                'start_time',
                'end_time',
                'status',
                'is_deleted',
            ]
            insert_values = [
                'Universidad Tecnologica Emiliano Zapata del Estado de Morelos',
                'UTEZ',
                'UTEZ',
                user_id,
                '07:00:00',
                '22:00:00',
                1,
                0,
            ]

            if 'image_id' in university_columns:
                cursor.execute("SELECT id FROM images ORDER BY id ASC LIMIT 1")
                image_row = cursor.fetchone()
                if not image_row:
                    cursor.execute(
                        """
                        INSERT INTO images (image_name, mime_type, extension, sha256, file_size, image_path, is_deleted)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            'utez-default',
                            'image/png',
                            'png',
                            '0000000000000000000000000000000000000000000000000000000000000000',
                            0,
                            'universities/utez-default.png',
                            0,
                        ],
                    )
                    image_row = (cursor.lastrowid,)
                if image_row:
                    insert_columns.append('image_id')
                    insert_values.append(image_row[0])

            if 'period_type_id' in university_columns:
                cursor.execute("SELECT id FROM period_types ORDER BY id ASC LIMIT 1")
                period_row = cursor.fetchone()
                if not period_row:
                    cursor.execute(
                        """
                        INSERT INTO period_types (name, code, months_duration, status)
                        VALUES (%s, %s, %s, %s)
                        """,
                        ['Cuatrimestre', 'CUAT', 4, 1],
                    )
                    period_row = (cursor.lastrowid,)
                if period_row:
                    insert_columns.append('period_type_id')
                    insert_values.append(period_row[0])

            if 'uses_period_groups' in university_columns:
                insert_columns.append('uses_period_groups')
                insert_values.append(1)

            placeholders = ', '.join(['%s'] * len(insert_values))
            cursor.execute(
                f"INSERT INTO universities ({', '.join(insert_columns)}) VALUES ({placeholders})",
                insert_values,
            )
            university_id = cursor.lastrowid

        cursor.execute(
            "SELECT id FROM user_configurations WHERE user_id = %s ORDER BY id DESC LIMIT 1",
            [user_id],
        )
        row = cursor.fetchone()

        if row:
            cursor.execute(
                """
                UPDATE user_configurations
                SET selected_university_id = %s, status = COALESCE(status, 1)
                WHERE id = %s
                """,
                [university_id, row[0]],
            )


def reverse_seed_utez_selected_university(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM universities WHERE short_name = %s LIMIT 1",
            ['UTEZ'],
        )
        row = cursor.fetchone()
        if not row:
            return

        university_id = row[0]

        cursor.execute(
            """
            UPDATE user_configurations
            SET selected_university_id = NULL
            WHERE selected_university_id = %s
            """,
            [university_id],
        )

        cursor.execute("DELETE FROM universities WHERE id = %s", [university_id])


class Migration(migrations.Migration):

    dependencies = [
        ('universities', '0001_initial'),
        ('user_accounts', '0003_selected_university_fk_in_user_configurations'),
    ]

    operations = [
        migrations.RunPython(seed_utez_selected_university, reverse_seed_utez_selected_university),
    ]
