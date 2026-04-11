from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('teachers', '0002_align_teachers_schema'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE TABLE IF NOT EXISTS `teachers_subjects` (
                    `id` BIGINT NOT NULL AUTO_INCREMENT,
                    `teachers_id` BIGINT NOT NULL,
                    `subjects_id` INT NOT NULL,
                    `is_deleted` INT NOT NULL DEFAULT 0,
                    `created_at` DATETIME NULL,
                    `created_by` VARCHAR(100) NULL,
                    `updated_at` DATETIME NULL,
                    `updated_by` VARCHAR(100) NULL,
                    PRIMARY KEY (`id`),
                    INDEX `idx_teachers_subjects_teachers` (`teachers_id`),
                    INDEX `idx_teachers_subjects_subjects` (`subjects_id`),
                    CONSTRAINT `fk_teachers_subjects_teachers`
                        FOREIGN KEY (`teachers_id`) REFERENCES `teachers` (`id`),
                    CONSTRAINT `fk_teachers_subjects_subjects`
                        FOREIGN KEY (`subjects_id`) REFERENCES `subjects` (`id`)
                );
            """,
            reverse_sql="""
                DROP TABLE IF EXISTS `teachers_subjects`;
            """,
        ),
    ]
