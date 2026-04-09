USE cdi_horarios;

-- -----------------------------------------------------
/*  DATOS DE PRUEBA (NO CATALOGOS BASE)               */
-- -----------------------------------------------------

-- -----------------------------------------------------
/*  1) USUARIOS Y CONFIGURACION BASE                  */
-- -----------------------------------------------------

INSERT INTO users (name, surname, last_name, email, password, status, role_id)
SELECT
  'Admin',
  'Sistema',
  'Horarios',
  'admin@gmail.com',
  'bcrypt_sha256$$2b$12$Bnk3UjyRKuiD4JxccE4gZ.gE37pdF6swpTHtAhVzsEPIwNuoXtv6O',
  1,
  (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@gmail.com'
);

INSERT INTO users (name, surname, last_name, email, password, status, role_id)
SELECT
  'Usuario',
  'Sistema',
  'Horarios',
  'usuario@gmail.com',
  'bcrypt_sha256$$2b$12$sg6nN/Ltj.kxwSd29afbXOf2fhyDYcnWBS5q04wPAWSqE/S2lw.i2',
  1,
  (SELECT id FROM roles WHERE name = 'usuario' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'usuario@gmail.com'
);

INSERT INTO user_configurations (user_id, selected_university_id, theme, accent, schedule_generation, status)
SELECT
  u.id,
  NULL,
  'light',
  'blue',
  JSON_OBJECT('draft_schedule_university_ids', JSON_ARRAY()),
  1
FROM users u
LEFT JOIN user_configurations uc ON uc.user_id = u.id
WHERE u.email IN ('admin@gmail.com', 'usuario@gmail.com')
  AND uc.id IS NULL;

UPDATE user_configurations uc
JOIN users u ON u.id = uc.user_id
SET
  uc.theme = COALESCE(NULLIF(uc.theme, ''), 'light'),
  uc.accent = COALESCE(NULLIF(uc.accent, ''), 'blue'),
  uc.schedule_generation = COALESCE(
    uc.schedule_generation,
    JSON_OBJECT('draft_schedule_university_ids', JSON_ARRAY())
  ),
  uc.status = COALESCE(uc.status, 1)
WHERE u.email IN ('admin@gmail.com', 'usuario@gmail.com');

-- -----------------------------------------------------
/*  2) IMAGENES Y UNIVERSIDADES: UTEZ + ITZ          */
-- -----------------------------------------------------

INSERT INTO images (image_name, mime_type, extension, sha256, file_size, image_path, is_deleted)
SELECT
  'utez-logo',
  'image/png',
  'png',
  '0000000000000000000000000000000000000000000000000000000000000001',
  0,
  'universities/utez-logo.png',
  0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM images WHERE image_path = 'universities/utez-logo.png'
);

INSERT INTO images (image_name, mime_type, extension, sha256, file_size, image_path, is_deleted)
SELECT
  'itz-logo',
  'image/png',
  'png',
  '0000000000000000000000000000000000000000000000000000000000000002',
  0,
  'universities/itz-logo.png',
  0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM images WHERE image_path = 'universities/itz-logo.png'
);

SET @admin_user_id = (
  SELECT id FROM users WHERE email = 'admin@gmail.com' AND status = 1 ORDER BY id DESC LIMIT 1
);
SET @usuario_user_id = (
  SELECT id FROM users WHERE email = 'usuario@gmail.com' AND status = 1 ORDER BY id DESC LIMIT 1
);

SET @period_cuat_id = (
  SELECT id FROM period_types WHERE code = 'CUAT' AND status = 1 ORDER BY id DESC LIMIT 1
);
SET @period_sem_id = (
  SELECT id FROM period_types WHERE code = 'SEM' AND status = 1 ORDER BY id DESC LIMIT 1
);

SET @img_utez_id = (
  SELECT id FROM images
  WHERE image_path = 'universities/utez-logo.png' AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);
SET @img_itz_id = (
  SELECT id FROM images
  WHERE image_path = 'universities/itz-logo.png' AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);

INSERT INTO universities (
  name,
  short_name,
  institution_code,
  image_id,
  user_id,
  start_time,
  end_time,
  period_type_id,
  uses_period_groups,
  status,
  is_deleted
)
SELECT
  'Universidad Tecnologica Emiliano Zapata del Estado de Morelos',
  'UTEZ',
  'UTEZ',
  @img_utez_id,
  COALESCE(@usuario_user_id, @admin_user_id),
  '07:00:00',
  '22:00:00',
  @period_cuat_id,
  1,
  1,
  0
FROM DUAL
WHERE @period_cuat_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM universities WHERE short_name = 'UTEZ'
  );

INSERT INTO universities (
  name,
  short_name,
  institution_code,
  image_id,
  user_id,
  start_time,
  end_time,
  period_type_id,
  uses_period_groups,
  status,
  is_deleted
)
SELECT
  'Instituto Tecnologico de Zacatepec',
  'ITZ',
  'ITZ',
  @img_itz_id,
  COALESCE(@usuario_user_id, @admin_user_id),
  '07:00:00',
  '21:00:00',
  @period_sem_id,
  0,
  1,
  0
FROM DUAL
WHERE @period_sem_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM universities WHERE short_name = 'ITZ'
  );

SET @utez_id = (
  SELECT id FROM universities
  WHERE short_name = 'UTEZ' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);
SET @itz_id = (
  SELECT id FROM universities
  WHERE short_name = 'ITZ' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);

UPDATE universities
SET user_id = COALESCE(@usuario_user_id, @admin_user_id)
WHERE short_name IN ('UTEZ', 'ITZ')
  AND status = 1
  AND is_deleted = 0;

DELETE uc
FROM user_configurations uc
JOIN users u ON u.id = uc.user_id
WHERE u.email = 'itz.coordinacion@gmail.com';

DELETE u
FROM users u
LEFT JOIN universities univ
  ON univ.user_id = u.id
WHERE u.email = 'itz.coordinacion@gmail.com'
  AND univ.id IS NULL;

UPDATE user_configurations uc
JOIN users u ON u.id = uc.user_id
SET
  uc.selected_university_id = CASE
    WHEN u.email = 'usuario@gmail.com' THEN @utez_id
    WHEN u.email = 'admin@gmail.com' THEN NULL
    ELSE uc.selected_university_id
  END,
  uc.status = 1
WHERE u.email IN ('admin@gmail.com', 'usuario@gmail.com');

-- -----------------------------------------------------
/*  3) MODALIDADES, TURNOS, PERIODOS ACADEMICOS      */
-- -----------------------------------------------------

INSERT INTO modalities (name, require_classroom, status, configurations, university_id)
SELECT m.name, m.require_classroom, 1, m.configurations, m.university_id
FROM (
  SELECT 'Presencial' AS name, 1 AS require_classroom, '{"allowed_days": [1,2,3,4,5], "classroom_days_per_week": 5}' AS configurations, @utez_id AS university_id
  UNION ALL SELECT 'En linea', 0, '{"allowed_days": [1,2,3,4,5], "classroom_days_per_week": 0}', @utez_id
  UNION ALL SELECT 'Mixta', 1, '{"allowed_days": [1,2,3,4,5], "classroom_days_per_week": 3}', @utez_id
  UNION ALL SELECT 'Presencial', 1, '{"allowed_days": [1,2,3,4,5], "classroom_days_per_week": 5}', @itz_id
  UNION ALL SELECT 'En linea', 0, '{"allowed_days": [1,2,3,4,5], "classroom_days_per_week": 0}', @itz_id
  UNION ALL SELECT 'Mixta', 1, '{"allowed_days": [1,2,3,4,5], "classroom_days_per_week": 3}', @itz_id
  UNION ALL SELECT 'Sabatino', 1, '{"allowed_days": [6], "classroom_days_per_week": 1}', @itz_id
) AS m
LEFT JOIN modalities existing
  ON existing.name = m.name
 AND existing.university_id = m.university_id
 AND existing.status = 1
WHERE existing.id IS NULL
  AND m.university_id IS NOT NULL;

SET @utez_mod_presencial_id = (
  SELECT id FROM modalities
  WHERE university_id = @utez_id AND name = 'Presencial' AND status = 1
  ORDER BY id DESC
  LIMIT 1
);
SET @utez_mod_mixta_id = (
  SELECT id FROM modalities
  WHERE university_id = @utez_id AND name = 'Mixta' AND status = 1
  ORDER BY id DESC
  LIMIT 1
);
SET @itz_mod_presencial_id = (
  SELECT id FROM modalities
  WHERE university_id = @itz_id AND name = 'Presencial' AND status = 1
  ORDER BY id DESC
  LIMIT 1
);
SET @itz_mod_mixta_id = (
  SELECT id FROM modalities
  WHERE university_id = @itz_id AND name = 'Mixta' AND status = 1
  ORDER BY id DESC
  LIMIT 1
);

INSERT INTO shifts (name, university_id, `order`, start_time, end_time, status, is_deleted)
SELECT s.name, s.university_id, s.ord, s.start_time, s.end_time, 1, 0
FROM (
  SELECT 'Matutino' AS name, @utez_id AS university_id, 1 AS ord, '07:00:00' AS start_time, '14:00:00' AS end_time
  UNION ALL SELECT 'Vespertino', @utez_id, 2, '14:00:00', '22:00:00'
  UNION ALL SELECT 'Matutino', @itz_id, 1, '07:00:00', '13:00:00'
  UNION ALL SELECT 'Vespertino', @itz_id, 2, '13:00:00', '20:00:00'
) AS s
LEFT JOIN shifts existing
  ON existing.university_id = s.university_id
 AND existing.name = s.name
 AND existing.is_deleted = 0
WHERE existing.id IS NULL
  AND s.university_id IS NOT NULL;

SET @utez_shift_matutino_id = (
  SELECT id FROM shifts
  WHERE university_id = @utez_id AND name = 'Matutino' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);
SET @utez_shift_vespertino_id = (
  SELECT id FROM shifts
  WHERE university_id = @utez_id AND name = 'Vespertino' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);
SET @itz_shift_matutino_id = (
  SELECT id FROM shifts
  WHERE university_id = @itz_id AND name = 'Matutino' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);
SET @itz_shift_vespertino_id = (
  SELECT id FROM shifts
  WHERE university_id = @itz_id AND name = 'Vespertino' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);

INSERT INTO academic_periods (name, university_id, start_month, end_month, year, `order`, is_active, is_deleted)
SELECT p.name, p.university_id, p.start_month, p.end_month, p.year, p.ord, p.is_active, 0
FROM (
  SELECT 'Enero - Abril 2026' AS name, @utez_id AS university_id, 1 AS start_month, 4 AS end_month, 2026 AS year, 1 AS ord, 0 AS is_active
  UNION ALL SELECT 'Mayo - Agosto 2026', @utez_id, 5, 8, 2026, 2, 1
  UNION ALL SELECT 'Septiembre - Diciembre 2026', @utez_id, 9, 12, 2026, 3, 0
  UNION ALL SELECT 'Enero - Junio 2026', @itz_id, 1, 6, 2026, 1, 1
  UNION ALL SELECT 'Agosto - Diciembre 2026', @itz_id, 8, 12, 2026, 2, 0
) AS p
LEFT JOIN academic_periods existing
  ON existing.university_id = p.university_id
 AND existing.name = p.name
 AND COALESCE(existing.year, 0) = p.year
 AND existing.is_deleted = 0
WHERE existing.id IS NULL
  AND p.university_id IS NOT NULL;

UPDATE academic_periods
SET is_active = CASE
  WHEN university_id = @utez_id AND name = 'Mayo - Agosto 2026' THEN 1
  WHEN university_id = @utez_id THEN 0
  ELSE is_active
END
WHERE university_id = @utez_id
  AND is_deleted = 0;

UPDATE academic_periods
SET is_active = CASE
  WHEN university_id = @itz_id AND name = 'Enero - Junio 2026' THEN 1
  WHEN university_id = @itz_id THEN 0
  ELSE is_active
END
WHERE university_id = @itz_id
  AND is_deleted = 0;

SET @utez_period_active_id = (
  SELECT id FROM academic_periods
  WHERE university_id = @utez_id AND is_active = 1 AND is_deleted = 0
  ORDER BY `order` ASC, id ASC
  LIMIT 1
);

-- -----------------------------------------------------
/*  4) CARRERAS, EXCEPCIONES Y GRUPOS                 */
-- -----------------------------------------------------

INSERT INTO careers (name, university_id, short_name, code, modality_id, total_periods, status, is_deleted)
SELECT c.name, c.university_id, c.short_name, c.code, c.modality_id, c.total_periods, 1, 0
FROM (
  SELECT 'Ingenieria en Tecnologias de la Informacion e Innovacion Digital' AS name, @utez_id AS university_id, 'ITIID' AS short_name, 'UTEZ-ITIID' AS code, @utez_mod_presencial_id AS modality_id, 9 AS total_periods
  UNION ALL SELECT 'Ingenieria Industrial', @utez_id, 'II', 'UTEZ-II', @utez_mod_presencial_id, 9
  UNION ALL SELECT 'Ingenieria Mecatronica', @utez_id, 'IM', 'UTEZ-IM', @utez_mod_presencial_id, 9
  UNION ALL SELECT 'Licenciatura en Administracion', @utez_id, 'LA', 'UTEZ-LA', @utez_mod_presencial_id, 9
  UNION ALL SELECT 'Licenciatura en Contaduria', @utez_id, 'LC', 'UTEZ-LC', @utez_mod_presencial_id, 9
  UNION ALL SELECT 'Ingenieria en Sistemas Computacionales', @itz_id, 'ISC', 'ITZ-ISC', @itz_mod_presencial_id, 9
  UNION ALL SELECT 'Ingenieria Industrial', @itz_id, 'IIND', 'ITZ-IIND', @itz_mod_presencial_id, 9
  UNION ALL SELECT 'Ingenieria Electromecanica', @itz_id, 'IEM', 'ITZ-IEM', @itz_mod_presencial_id, 9
  UNION ALL SELECT 'Ingenieria en Gestion Empresarial', @itz_id, 'IGE', 'ITZ-IGE', @itz_mod_mixta_id, 9
  UNION ALL SELECT 'Ingenieria Informatica', @itz_id, 'IINF', 'ITZ-IINF', @itz_mod_presencial_id, 9
) AS c
LEFT JOIN careers existing ON existing.code = c.code AND existing.university_id = c.university_id
WHERE existing.id IS NULL
  AND c.university_id IS NOT NULL
  AND c.modality_id IS NOT NULL;

SET @utez_career_itiid_id = (
  SELECT id FROM careers WHERE code = 'UTEZ-ITIID' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @utez_career_ii_id = (
  SELECT id FROM careers WHERE code = 'UTEZ-II' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @utez_career_im_id = (
  SELECT id FROM careers WHERE code = 'UTEZ-IM' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @utez_career_la_id = (
  SELECT id FROM careers WHERE code = 'UTEZ-LA' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @utez_career_lc_id = (
  SELECT id FROM careers WHERE code = 'UTEZ-LC' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);

SET @itz_career_isc_id = (
  SELECT id FROM careers WHERE code = 'ITZ-ISC' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @itz_career_iind_id = (
  SELECT id FROM careers WHERE code = 'ITZ-IIND' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @itz_career_iem_id = (
  SELECT id FROM careers WHERE code = 'ITZ-IEM' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @itz_career_ige_id = (
  SELECT id FROM careers WHERE code = 'ITZ-IGE' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @itz_career_iinf_id = (
  SELECT id FROM careers WHERE code = 'ITZ-IINF' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);

INSERT INTO career_period_exceptions (career_id, period_number, reason, status, is_deleted)
SELECT e.career_id, e.period_number, e.reason, 1, 0
FROM (
  SELECT @utez_career_itiid_id AS career_id, 9 AS period_number, 'Estadia profesional' AS reason
  UNION ALL SELECT @utez_career_ii_id, 9, 'Estadia profesional'
  UNION ALL SELECT @utez_career_im_id, 9, 'Estadia profesional'
  UNION ALL SELECT @utez_career_la_id, 9, 'Estadia profesional'
  UNION ALL SELECT @utez_career_lc_id, 9, 'Estadia profesional'
  UNION ALL SELECT @itz_career_isc_id, 9, 'Residencia profesional'
  UNION ALL SELECT @itz_career_iind_id, 9, 'Residencia profesional'
  UNION ALL SELECT @itz_career_iem_id, 9, 'Residencia profesional'
  UNION ALL SELECT @itz_career_ige_id, 9, 'Residencia profesional'
  UNION ALL SELECT @itz_career_iinf_id, 9, 'Residencia profesional'
) AS e
LEFT JOIN career_period_exceptions existing
  ON existing.career_id = e.career_id
 AND existing.period_number = e.period_number
 AND existing.is_deleted = 0
WHERE existing.id IS NULL
  AND e.career_id IS NOT NULL;

INSERT INTO `groups` (name, career_id, period_number, letter, shift_id, academic_period_id, university_id, status, is_deleted)
SELECT g.name, c.id, g.period_number, g.letter, g.shift_id, g.academic_period_id, g.university_id, 1, 0
FROM (
  SELECT 'ITIID 1A' AS name, 'UTEZ-ITIID' AS career_code, 1 AS period_number, 'A' AS letter, @utez_shift_matutino_id AS shift_id, @utez_period_active_id AS academic_period_id, @utez_id AS university_id
  UNION ALL SELECT 'ITIID 3A', 'UTEZ-ITIID', 3, 'A', @utez_shift_matutino_id, @utez_period_active_id, @utez_id
  UNION ALL SELECT 'II 1A', 'UTEZ-II', 1, 'A', @utez_shift_vespertino_id, @utez_period_active_id, @utez_id
  UNION ALL SELECT 'IM 5A', 'UTEZ-IM', 5, 'A', @utez_shift_vespertino_id, @utez_period_active_id, @utez_id
  UNION ALL SELECT 'LA 1A', 'UTEZ-LA', 1, 'A', @utez_shift_matutino_id, @utez_period_active_id, @utez_id
  UNION ALL SELECT 'LC 1A', 'UTEZ-LC', 1, 'A', @utez_shift_matutino_id, @utez_period_active_id, @utez_id
  UNION ALL SELECT 'ISC 1A', 'ITZ-ISC', 1, 'A', @itz_shift_matutino_id, NULL, @itz_id
  UNION ALL SELECT 'ISC 3A', 'ITZ-ISC', 3, 'A', @itz_shift_matutino_id, NULL, @itz_id
  UNION ALL SELECT 'IIND 1A', 'ITZ-IIND', 1, 'A', @itz_shift_vespertino_id, NULL, @itz_id
  UNION ALL SELECT 'IEM 5A', 'ITZ-IEM', 5, 'A', @itz_shift_vespertino_id, NULL, @itz_id
  UNION ALL SELECT 'IGE 1A', 'ITZ-IGE', 1, 'A', @itz_shift_vespertino_id, NULL, @itz_id
  UNION ALL SELECT 'IINF 1A', 'ITZ-IINF', 1, 'A', @itz_shift_matutino_id, NULL, @itz_id
) AS g
JOIN careers c ON c.code = g.career_code
LEFT JOIN `groups` existing
  ON existing.career_id = c.id
 AND existing.period_number = g.period_number
 AND existing.letter = g.letter
 AND existing.university_id = g.university_id
 AND existing.is_deleted = 0
WHERE existing.id IS NULL
  AND g.shift_id IS NOT NULL;

-- -----------------------------------------------------
/*  5) MATERIAS Y MAPEO CARRERA-MATERIA              */
-- -----------------------------------------------------

SET @color_azul_id = (
  SELECT id FROM colors WHERE name = 'Azul' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @color_esmeralda_id = (
  SELECT id FROM colors WHERE name = 'Esmeralda' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @color_naranja_id = (
  SELECT id FROM colors WHERE name = 'Naranja' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @color_rosa_id = (
  SELECT id FROM colors WHERE name = 'Rosa' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @color_turquesa_id = (
  SELECT id FROM colors WHERE name = 'Turquesa' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);
SET @color_indigo_id = (
  SELECT id FROM colors WHERE name = 'Indigo' AND status = 1 AND is_deleted = 0 ORDER BY id DESC LIMIT 1
);

INSERT INTO subjects (
  name,
  short_name,
  code,
  description,
  hours_per_week,
  color_id,
  university_id,
  is_restricted_to_classroom_types,
  is_mandatory,
  status,
  is_deleted
)
SELECT
  s.name,
  s.short_name,
  s.code,
  s.description,
  s.hours_per_week,
  s.color_id,
  s.university_id,
  CASE
    WHEN s.code IN ('UTEZ-ING1') THEN 1
    ELSE 0
  END AS is_restricted_to_classroom_types,
  s.is_mandatory,
  1,
  0
FROM (
  SELECT 'Algebra' AS name, 'ALG' AS short_name, 'UTEZ-MAT1' AS code, 'Bases matematicas' AS description, 4 AS hours_per_week, @color_azul_id AS color_id, @utez_id AS university_id, 1 AS is_mandatory
  UNION ALL SELECT 'Fundamentos de programacion', 'FDP', 'UTEZ-PROG1', 'Programacion inicial', 5, @color_esmeralda_id, @utez_id, 1
  UNION ALL SELECT 'Ingles I', 'ING1', 'UTEZ-ING1', 'Competencia comunicativa', 3, @color_naranja_id, @utez_id, 1
  UNION ALL SELECT 'Fisica aplicada', 'FIS1', 'UTEZ-FIS1', 'Principios de fisica', 4, @color_indigo_id, @utez_id, 1
  UNION ALL SELECT 'Administracion I', 'ADM1', 'UTEZ-ADM1', 'Fundamentos de administracion', 4, @color_turquesa_id, @utez_id, 1
  UNION ALL SELECT 'Contabilidad I', 'CONT1', 'UTEZ-CONT1', 'Registro contable basico', 4, @color_rosa_id, @utez_id, 1
  UNION ALL SELECT 'Estadistica', 'EST', 'UTEZ-EST1', 'Analisis de datos', 4, @color_azul_id, @utez_id, 1
  UNION ALL SELECT 'Bases de datos', 'BD', 'UTEZ-BD1', 'Modelo relacional', 5, @color_esmeralda_id, @utez_id, 1
  UNION ALL SELECT 'Programacion orientada a objetos', 'POO', 'UTEZ-POO', 'Diseno orientado a objetos', 5, @color_naranja_id, @utez_id, 1
  UNION ALL SELECT 'Redes de datos', 'RED', 'UTEZ-REDES', 'Comunicacion de redes', 4, @color_indigo_id, @utez_id, 1
  UNION ALL SELECT 'Calculo diferencial', 'CALC', 'UTEZ-CALC', 'Calculo y modelado', 5, @color_azul_id, @utez_id, 1
  UNION ALL SELECT 'Manufactura basica', 'MAN', 'UTEZ-MANUF', 'Procesos de manufactura', 4, @color_turquesa_id, @utez_id, 1
  UNION ALL SELECT 'Robotica I', 'ROB1', 'UTEZ-ROBO', 'Sistemas roboticos', 5, @color_esmeralda_id, @utez_id, 1
  UNION ALL SELECT 'Automatizacion y control', 'AUT', 'UTEZ-AUTOC', 'Control de procesos', 5, @color_naranja_id, @utez_id, 1
  UNION ALL SELECT 'Costos', 'COST', 'UTEZ-COST', 'Analisis de costos', 4, @color_rosa_id, @utez_id, 1

  UNION ALL SELECT 'Calculo integral', 'CALCI', 'ITZ-CALC1', 'Calculo para ingenieria', 5, @color_azul_id, @itz_id, 1
  UNION ALL SELECT 'Fisica I', 'FISI', 'ITZ-FIS1', 'Mecanica clasica', 4, @color_indigo_id, @itz_id, 1
  UNION ALL SELECT 'Quimica', 'QUI', 'ITZ-QUIM1', 'Quimica general', 4, @color_turquesa_id, @itz_id, 1
  UNION ALL SELECT 'Programacion', 'PROG', 'ITZ-PROG1', 'Logica de programacion', 5, @color_esmeralda_id, @itz_id, 1
  UNION ALL SELECT 'Base de datos', 'BDA', 'ITZ-BD1', 'Diseno de bases de datos', 5, @color_naranja_id, @itz_id, 1
  UNION ALL SELECT 'Estadistica descriptiva', 'ESTD', 'ITZ-ESTAD', 'Medidas y distribuciones', 4, @color_azul_id, @itz_id, 1
  UNION ALL SELECT 'Contabilidad financiera', 'CONT', 'ITZ-CONT', 'Estados financieros', 4, @color_rosa_id, @itz_id, 1
  UNION ALL SELECT 'Administracion', 'ADM', 'ITZ-ADMIN', 'Gestion organizacional', 4, @color_turquesa_id, @itz_id, 1
  UNION ALL SELECT 'Circuitos electricos', 'ELEC', 'ITZ-ELEC1', 'Analisis de circuitos', 5, @color_indigo_id, @itz_id, 1
  UNION ALL SELECT 'Mecanica de materiales', 'MEC', 'ITZ-MEC1', 'Resistencia de materiales', 5, @color_esmeralda_id, @itz_id, 1
  UNION ALL SELECT 'Redes de computadoras', 'RDC', 'ITZ-REDES', 'Infraestructura de red', 4, @color_naranja_id, @itz_id, 1
  UNION ALL SELECT 'Algebra lineal', 'ALGL', 'ITZ-ALG', 'Vectores y matrices', 4, @color_azul_id, @itz_id, 1
) AS s
LEFT JOIN subjects existing
  ON existing.code = s.code
 AND existing.university_id = s.university_id
WHERE existing.id IS NULL
  AND s.university_id IS NOT NULL
  AND s.color_id IS NOT NULL;

INSERT INTO career_subjects (subjects_id, careers_id, period_number, is_deleted)
SELECT s.id, m.career_id, m.period_number, 0
FROM (
  SELECT @utez_career_itiid_id AS career_id, 'UTEZ-MAT1' AS subject_code, 1 AS period_number, @utez_id AS university_id
  UNION ALL SELECT @utez_career_itiid_id, 'UTEZ-PROG1', 1, @utez_id
  UNION ALL SELECT @utez_career_itiid_id, 'UTEZ-ING1', 1, @utez_id
  UNION ALL SELECT @utez_career_itiid_id, 'UTEZ-BD1', 3, @utez_id
  UNION ALL SELECT @utez_career_itiid_id, 'UTEZ-POO', 3, @utez_id
  UNION ALL SELECT @utez_career_itiid_id, 'UTEZ-EST1', 3, @utez_id

  UNION ALL SELECT @utez_career_ii_id, 'UTEZ-CALC', 1, @utez_id
  UNION ALL SELECT @utez_career_ii_id, 'UTEZ-FIS1', 1, @utez_id
  UNION ALL SELECT @utez_career_ii_id, 'UTEZ-MANUF', 1, @utez_id

  UNION ALL SELECT @utez_career_im_id, 'UTEZ-ROBO', 5, @utez_id
  UNION ALL SELECT @utez_career_im_id, 'UTEZ-AUTOC', 5, @utez_id
  UNION ALL SELECT @utez_career_im_id, 'UTEZ-FIS1', 5, @utez_id

  UNION ALL SELECT @utez_career_la_id, 'UTEZ-ADM1', 1, @utez_id
  UNION ALL SELECT @utez_career_la_id, 'UTEZ-CONT1', 1, @utez_id
  UNION ALL SELECT @utez_career_la_id, 'UTEZ-ING1', 1, @utez_id

  UNION ALL SELECT @utez_career_lc_id, 'UTEZ-CONT1', 1, @utez_id
  UNION ALL SELECT @utez_career_lc_id, 'UTEZ-ADM1', 1, @utez_id
  UNION ALL SELECT @utez_career_lc_id, 'UTEZ-EST1', 1, @utez_id

  UNION ALL SELECT @itz_career_isc_id, 'ITZ-CALC1', 1, @itz_id
  UNION ALL SELECT @itz_career_isc_id, 'ITZ-PROG1', 1, @itz_id
  UNION ALL SELECT @itz_career_isc_id, 'ITZ-ALG', 1, @itz_id
  UNION ALL SELECT @itz_career_isc_id, 'ITZ-BD1', 3, @itz_id
  UNION ALL SELECT @itz_career_isc_id, 'ITZ-REDES', 3, @itz_id
  UNION ALL SELECT @itz_career_isc_id, 'ITZ-ESTAD', 3, @itz_id

  UNION ALL SELECT @itz_career_iind_id, 'ITZ-CALC1', 1, @itz_id
  UNION ALL SELECT @itz_career_iind_id, 'ITZ-QUIM1', 1, @itz_id
  UNION ALL SELECT @itz_career_iind_id, 'ITZ-ADMIN', 1, @itz_id

  UNION ALL SELECT @itz_career_iem_id, 'ITZ-ELEC1', 5, @itz_id
  UNION ALL SELECT @itz_career_iem_id, 'ITZ-MEC1', 5, @itz_id
  UNION ALL SELECT @itz_career_iem_id, 'ITZ-FIS1', 5, @itz_id

  UNION ALL SELECT @itz_career_ige_id, 'ITZ-ADMIN', 1, @itz_id
  UNION ALL SELECT @itz_career_ige_id, 'ITZ-CONT', 1, @itz_id
  UNION ALL SELECT @itz_career_ige_id, 'ITZ-ESTAD', 1, @itz_id

  UNION ALL SELECT @itz_career_iinf_id, 'ITZ-PROG1', 1, @itz_id
  UNION ALL SELECT @itz_career_iinf_id, 'ITZ-BD1', 1, @itz_id
  UNION ALL SELECT @itz_career_iinf_id, 'ITZ-ALG', 1, @itz_id
) AS m
JOIN subjects s
  ON s.code = m.subject_code
 AND s.university_id = m.university_id
LEFT JOIN career_subjects existing
  ON existing.subjects_id = s.id
 AND existing.careers_id = m.career_id
 AND existing.period_number = m.period_number
 AND existing.is_deleted = 0
WHERE existing.id IS NULL
  AND m.career_id IS NOT NULL;

-- -----------------------------------------------------
/*  6) PROFESORES, DISPONIBILIDAD Y ASIGNACION       */
-- -----------------------------------------------------

INSERT INTO teachers (name, surname, last_name, require_classroom, status, is_deleted)
SELECT t.name, t.surname, t.last_name, t.require_classroom, 1, 0
FROM (
  SELECT 'Andres' AS name, 'Vega' AS surname, 'Salinas' AS last_name, 1 AS require_classroom
  UNION ALL SELECT 'Mariana', 'Rojas', 'Vera', 0
  UNION ALL SELECT 'Diego', 'Pineda', 'Franco', 1
  UNION ALL SELECT 'Laura', 'Castaneda', 'Luna', 0
  UNION ALL SELECT 'Fernando', 'Nava', 'Soto', 1
  UNION ALL SELECT 'Patricia', 'Ocampo', 'Reyes', 0
  UNION ALL SELECT 'Ricardo', 'Tovar', 'Mendez', 1
  UNION ALL SELECT 'Gabriela', 'Sosa', 'Vidal', 0
  UNION ALL SELECT 'Hector', 'Palacios', 'Ruiz', 1
  UNION ALL SELECT 'Daniela', 'Bautista', 'Leon', 0

  UNION ALL SELECT 'Omar', 'Cedillo', 'Rangel', 1
  UNION ALL SELECT 'Natalia', 'Campos', 'Lugo', 0
  UNION ALL SELECT 'Ivan', 'Serrano', 'Mora', 1
  UNION ALL SELECT 'Karla', 'Trujillo', 'Neri', 0
  UNION ALL SELECT 'Ernesto', 'Valdez', 'Paz', 1
  UNION ALL SELECT 'Monica', 'Ortega', 'Rios', 0
  UNION ALL SELECT 'Julio', 'Arriaga', 'Nieto', 1
  UNION ALL SELECT 'Paola', 'Gallardo', 'Mena', 0
  UNION ALL SELECT 'Cesar', 'Zamora', 'Ibarra', 1
  UNION ALL SELECT 'Brenda', 'Escamilla', 'Pena', 0
) AS t
LEFT JOIN teachers existing
  ON existing.name = t.name
 AND existing.surname = t.surname
 AND COALESCE(existing.last_name, '') = COALESCE(t.last_name, '')
WHERE existing.id IS NULL;

SET @tu_next_id = COALESCE((SELECT MAX(id) FROM teachers_universities), 0);

INSERT INTO teachers_universities (id, teachers_id, universities_id, status, is_deleted)
SELECT
  (@tu_next_id := @tu_next_id + 1) AS id,
  t.id,
  @utez_id,
  1,
  0
FROM teachers t
JOIN (
  SELECT 'Andres' AS name, 'Vega' AS surname
  UNION ALL SELECT 'Mariana', 'Rojas'
  UNION ALL SELECT 'Diego', 'Pineda'
  UNION ALL SELECT 'Laura', 'Castaneda'
  UNION ALL SELECT 'Fernando', 'Nava'
  UNION ALL SELECT 'Patricia', 'Ocampo'
  UNION ALL SELECT 'Ricardo', 'Tovar'
  UNION ALL SELECT 'Gabriela', 'Sosa'
  UNION ALL SELECT 'Hector', 'Palacios'
  UNION ALL SELECT 'Daniela', 'Bautista'
) AS tu_seed ON tu_seed.name = t.name AND tu_seed.surname = t.surname
WHERE t.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1
    FROM teachers_universities tu
    WHERE tu.teachers_id = t.id
      AND tu.universities_id = @utez_id
  )
ORDER BY t.id;

INSERT INTO teachers_universities (id, teachers_id, universities_id, status, is_deleted)
SELECT
  (@tu_next_id := @tu_next_id + 1) AS id,
  t.id,
  @itz_id,
  1,
  0
FROM teachers t
JOIN (
  SELECT 'Omar' AS name, 'Cedillo' AS surname
  UNION ALL SELECT 'Natalia', 'Campos'
  UNION ALL SELECT 'Ivan', 'Serrano'
  UNION ALL SELECT 'Karla', 'Trujillo'
  UNION ALL SELECT 'Ernesto', 'Valdez'
  UNION ALL SELECT 'Monica', 'Ortega'
  UNION ALL SELECT 'Julio', 'Arriaga'
  UNION ALL SELECT 'Paola', 'Gallardo'
  UNION ALL SELECT 'Cesar', 'Zamora'
  UNION ALL SELECT 'Brenda', 'Escamilla'
) AS tu_seed ON tu_seed.name = t.name AND tu_seed.surname = t.surname
WHERE t.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1
    FROM teachers_universities tu
    WHERE tu.teachers_id = t.id
      AND tu.universities_id = @itz_id
  )
ORDER BY t.id;

INSERT INTO teachers_subjects (teachers_id, subjects_id, is_deleted)
SELECT t.id, s.id, 0
FROM (
  SELECT 'Mariana' AS teacher_name, 'Rojas' AS teacher_surname, 'UTEZ-PROG1' AS subject_code, @utez_id AS university_id
  UNION ALL SELECT 'Mariana', 'Rojas', 'UTEZ-POO', @utez_id
  UNION ALL SELECT 'Mariana', 'Rojas', 'UTEZ-BD1', @utez_id
  UNION ALL SELECT 'Mariana', 'Rojas', 'UTEZ-REDES', @utez_id
  UNION ALL SELECT 'Andres', 'Vega', 'UTEZ-MAT1', @utez_id
  UNION ALL SELECT 'Andres', 'Vega', 'UTEZ-CALC', @utez_id
  UNION ALL SELECT 'Andres', 'Vega', 'UTEZ-EST1', @utez_id
  UNION ALL SELECT 'Diego', 'Pineda', 'UTEZ-FIS1', @utez_id
  UNION ALL SELECT 'Diego', 'Pineda', 'UTEZ-ROBO', @utez_id
  UNION ALL SELECT 'Diego', 'Pineda', 'UTEZ-AUTOC', @utez_id
  UNION ALL SELECT 'Laura', 'Castaneda', 'UTEZ-ADM1', @utez_id
  UNION ALL SELECT 'Laura', 'Castaneda', 'UTEZ-CONT1', @utez_id
  UNION ALL SELECT 'Laura', 'Castaneda', 'UTEZ-COST', @utez_id
  UNION ALL SELECT 'Fernando', 'Nava', 'UTEZ-MANUF', @utez_id
  UNION ALL SELECT 'Patricia', 'Ocampo', 'UTEZ-ING1', @utez_id
  UNION ALL SELECT 'Gabriela', 'Sosa', 'UTEZ-PROG1', @utez_id
  UNION ALL SELECT 'Gabriela', 'Sosa', 'UTEZ-BD1', @utez_id

  UNION ALL SELECT 'Natalia', 'Campos', 'ITZ-PROG1', @itz_id
  UNION ALL SELECT 'Natalia', 'Campos', 'ITZ-ALG', @itz_id
  UNION ALL SELECT 'Natalia', 'Campos', 'ITZ-BD1', @itz_id
  UNION ALL SELECT 'Natalia', 'Campos', 'ITZ-REDES', @itz_id
  UNION ALL SELECT 'Omar', 'Cedillo', 'ITZ-CALC1', @itz_id
  UNION ALL SELECT 'Omar', 'Cedillo', 'ITZ-ESTAD', @itz_id
  UNION ALL SELECT 'Ivan', 'Serrano', 'ITZ-FIS1', @itz_id
  UNION ALL SELECT 'Ivan', 'Serrano', 'ITZ-QUIM1', @itz_id
  UNION ALL SELECT 'Karla', 'Trujillo', 'ITZ-ADMIN', @itz_id
  UNION ALL SELECT 'Karla', 'Trujillo', 'ITZ-CONT', @itz_id
  UNION ALL SELECT 'Ernesto', 'Valdez', 'ITZ-ELEC1', @itz_id
  UNION ALL SELECT 'Ernesto', 'Valdez', 'ITZ-MEC1', @itz_id
  UNION ALL SELECT 'Monica', 'Ortega', 'ITZ-BD1', @itz_id
  UNION ALL SELECT 'Paola', 'Gallardo', 'ITZ-ADMIN', @itz_id
) AS map
JOIN teachers t
  ON t.name = map.teacher_name
 AND t.surname = map.teacher_surname
 AND t.is_deleted = 0
JOIN subjects s ON s.code = map.subject_code AND s.university_id = map.university_id AND s.is_deleted = 0
LEFT JOIN teachers_subjects existing
  ON existing.teachers_id = t.id
 AND existing.subjects_id = s.id
 AND existing.is_deleted = 0
WHERE existing.id IS NULL;

INSERT INTO teacher_availabilities (teacher_id, day_of_week, start_time, end_time, is_available, is_deleted)
SELECT
  tu.teachers_id,
  d.day_of_week,
  '07:00:00',
  '21:00:00',
  1,
  0
FROM teachers_universities tu
JOIN (
  SELECT 1 AS day_of_week
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
  UNION ALL SELECT 5
) AS d
WHERE tu.universities_id IN (@utez_id, @itz_id)
  AND tu.status = 1
  AND tu.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1
    FROM teacher_availabilities ta
    WHERE ta.teacher_id = tu.teachers_id
      AND ta.day_of_week = d.day_of_week
      AND ta.start_time = '07:00:00'
      AND ta.end_time = '21:00:00'
      AND ta.is_deleted = 0
  );

-- -----------------------------------------------------
/*  7) AULAS Y RESTRICCIONES (CARRERA/MATERIA)       */
-- -----------------------------------------------------

SET @classroom_type_compu_id = (
  SELECT id FROM classroom_types
  WHERE name = 'CompuAula' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);
SET @classroom_type_aula_id = (
  SELECT id FROM classroom_types
  WHERE name = 'Aula' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);
SET @classroom_type_lab_id = (
  SELECT id FROM classroom_types
  WHERE name = 'Laboratorio' AND status = 1 AND is_deleted = 0
  ORDER BY id DESC
  LIMIT 1
);

INSERT INTO classrooms (
  name,
  classroom_type_id,
  code,
  floor,
  building,
  building_code,
  universities_id,
  is_restricted,
  is_restricted_to_subjects,
  status,
  is_deleted
)
SELECT c.name, c.classroom_type_id, c.code, c.floor, c.building, c.building_code, c.university_id, c.is_restricted, c.is_restricted_to_subjects, 1, 0
FROM (
  SELECT 'Aula UTEZ A101' AS name, @classroom_type_aula_id AS classroom_type_id, 'UTEZ-A101' AS code, 1 AS floor, 'Edificio A' AS building, 'A' AS building_code, @utez_id AS university_id, 0 AS is_restricted, 0 AS is_restricted_to_subjects
  UNION ALL SELECT 'Aula UTEZ A102', @classroom_type_aula_id, 'UTEZ-A102', 1, 'Edificio A', 'A', @utez_id, 0, 0
  UNION ALL SELECT 'CompuAula UTEZ C201', @classroom_type_compu_id, 'UTEZ-C201', 2, 'Edificio C', 'C', @utez_id, 1, 0
  UNION ALL SELECT 'Academia de Idiomas UTEZ', @classroom_type_compu_id, 'UTEZ-ACA-IDIOMAS', 2, 'Edificio C', 'C', @utez_id, 0, 1
  UNION ALL SELECT 'Laboratorio UTEZ L301', @classroom_type_lab_id, 'UTEZ-L301', 3, 'Edificio L', 'L', @utez_id, 1, 0

  UNION ALL SELECT 'Aula ITZ B101', @classroom_type_aula_id, 'ITZ-B101', 1, 'Edificio B', 'B', @itz_id, 0, 0
  UNION ALL SELECT 'Aula ITZ B102', @classroom_type_aula_id, 'ITZ-B102', 1, 'Edificio B', 'B', @itz_id, 0, 0
  UNION ALL SELECT 'CompuAula ITZ C201', @classroom_type_compu_id, 'ITZ-C201', 2, 'Centro de computo', 'CC', @itz_id, 1, 0
  UNION ALL SELECT 'Laboratorio ITZ L301', @classroom_type_lab_id, 'ITZ-L301', 3, 'Edificio de laboratorios', 'LAB', @itz_id, 1, 0
) AS c
LEFT JOIN classrooms existing
  ON existing.code = c.code
 AND existing.universities_id = c.university_id
 AND existing.is_deleted = 0
WHERE existing.id IS NULL
  AND c.classroom_type_id IS NOT NULL
  AND c.university_id IS NOT NULL;

INSERT INTO classroom_careers (careers_id, classrooms_id, is_deleted)
SELECT c.id, cl.id, 0
FROM (
  SELECT 'UTEZ-C201' AS classroom_code, 'UTEZ-ITIID' AS career_code
  UNION ALL SELECT 'UTEZ-C201', 'UTEZ-II'
  UNION ALL SELECT 'UTEZ-L301', 'UTEZ-IM'
  UNION ALL SELECT 'UTEZ-L301', 'UTEZ-II'
  UNION ALL SELECT 'ITZ-C201', 'ITZ-ISC'
  UNION ALL SELECT 'ITZ-C201', 'ITZ-IINF'
  UNION ALL SELECT 'ITZ-L301', 'ITZ-IEM'
  UNION ALL SELECT 'ITZ-L301', 'ITZ-IIND'
) AS map
JOIN classrooms cl ON cl.code = map.classroom_code AND cl.is_deleted = 0
JOIN careers c ON c.code = map.career_code AND c.is_deleted = 0
LEFT JOIN classroom_careers existing
  ON existing.careers_id = c.id
 AND existing.classrooms_id = cl.id
 AND existing.is_deleted = 0
WHERE existing.id IS NULL;

INSERT INTO subjects_classroom_types (subject_id, classroom_type_id, is_deleted)
SELECT s.id, @classroom_type_compu_id, 0
FROM subjects s
LEFT JOIN subjects_classroom_types existing
  ON existing.subject_id = s.id
 AND existing.classroom_type_id = @classroom_type_compu_id
 AND existing.is_deleted = 0
WHERE s.code = 'UTEZ-ING1'
  AND s.university_id = @utez_id
  AND s.is_deleted = 0
  AND @classroom_type_compu_id IS NOT NULL
  AND existing.id IS NULL;

UPDATE subjects
SET is_restricted_to_classroom_types = CASE
  WHEN code = 'UTEZ-ING1' AND university_id = @utez_id THEN 1
  ELSE is_restricted_to_classroom_types
END
WHERE university_id IN (@utez_id, @itz_id)
  AND is_deleted = 0;

INSERT INTO classroom_subjects (subject_id, classroom_id, is_deleted)
SELECT s.id, cl.id, 0
FROM classrooms cl
JOIN subjects s
  ON s.code = 'UTEZ-ING1'
 AND s.university_id = @utez_id
 AND s.is_deleted = 0
LEFT JOIN classroom_subjects existing
  ON existing.subject_id = s.id
 AND existing.classroom_id = cl.id
 AND existing.is_deleted = 0
WHERE cl.code = 'UTEZ-ACA-IDIOMAS'
  AND cl.universities_id = @utez_id
  AND cl.is_deleted = 0
  AND existing.id IS NULL;

UPDATE classrooms
SET is_restricted_to_subjects = CASE
  WHEN code = 'UTEZ-ACA-IDIOMAS' AND universities_id = @utez_id THEN 1
  ELSE is_restricted_to_subjects
END
WHERE universities_id IN (@utez_id, @itz_id)
  AND is_deleted = 0;

-- -----------------------------------------------------
/*  8) NOTA FINAL                                     */
-- -----------------------------------------------------
-- Este script NO inserta registros en schedule_versions.
-- Queda listo para generar horarios por primera vez desde la API.
