USE cdi_horarios;

-- -----------------------------------------------------
/*  TABLAS DE ROLES, USUARIOS Y CONFIGURACION BASE  */
-- -----------------------------------------------------

INSERT INTO roles (name) VALUES
  ('admin'),
  ('usuario');

INSERT INTO users (name, surname, last_name, email, password, status, role_id) VALUES
  (
    'Admin',
    'Sistema',
    'Horarios',
    'admin@gmail.com',
    'bcrypt_sha256$$2b$12$Bnk3UjyRKuiD4JxccE4gZ.gE37pdF6swpTHtAhVzsEPIwNuoXtv6O',
    1,
    (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
  ),
  (
    'Usuario',
    'Sistema',
    'Horarios',
    'usuario@gmail.com',
    'bcrypt_sha256$$2b$12$sg6nN/Ltj.kxwSd29afbXOf2fhyDYcnWBS5q04wPAWSqE/S2lw.i2',
    1,
    (SELECT id FROM roles WHERE name = 'usuario' LIMIT 1)
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
WHERE u.email IN ('admin@gmail.com', 'usuario@gmail.com');

-- -----------------------------------------------------
/*         TABLA DE TIPOS DE PERÍODO ACADÉMICO      */
-- -----------------------------------------------------
INSERT INTO period_types (name, code, months_duration, status) VALUES
  ('Cuatrimestre', 'CUAT',  4, 1),
  ('Semestre',     'SEM',   6, 1),
  ('Trimestre',    'TRIM',  3, 1),
  ('Anual',        'ANUAL', 12, 1);

-- -----------------------------------------------------
/*      UNIVERSIDAD BASE UTEZ (MIGRACION INICIAL)   */
-- -----------------------------------------------------

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
) SELECT
  'Universidad Tecnologica Emiliano Zapata del Estado de Morelos',
  'UTEZ',
  'UTEZ',
  NULL,
  COALESCE(
    (SELECT id FROM users WHERE email = 'usuario@gmail.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1)
  ),
  '07:00:00',
  '22:00:00',
  (SELECT id FROM period_types WHERE code = 'CUAT' LIMIT 1),
  1,
  1,
  0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM universities
  WHERE short_name = 'UTEZ'
);

SET @utez_id = (SELECT id FROM universities WHERE short_name = 'UTEZ' LIMIT 1);

UPDATE user_configurations
SET selected_university_id = @utez_id,
    status = 1
WHERE user_id = (SELECT id FROM users WHERE email = 'usuario@gmail.com' LIMIT 1);



-- -----------------------------------------------------
/*    TABLA DE COLORES PARA MATERIAS               */
-- -----------------------------------------------------
INSERT INTO colors (name, hex, contrast_hex, status, is_deleted
) VALUES
  ('Blanco',      'FFFFFF', '111827', 1, 0),
  ('Rojo',         'EF4444', 'FFFFFF', 1, 0),
  ('Naranja',      'F97316', '111827', 1, 0),
  ('Esmeralda',     '10B981', '111827', 1, 0),
  ('Azul',        '3B82F6', 'FFFFFF', 1, 0),
  ('Púrpura',      '8B5CF6', 'FFFFFF', 1, 0),
  ('Rosa',        'EC4899', '111827', 1, 0),
  ('Turquesa',        '14B8A6', '111827', 1, 0),
  ('Naranja oscuro', 'FF8C42', '111827', 1, 0),
  ('Indigo',      '5B6FFF', 'FFFFFF', 1, 0),
  ('Lima',        '84CC16', '111827', 1, 0);



-- ------------------------------------------------------
/*    TABLA DE MODALIDADES DE CLASES               */
-- ------------------------------------------------------

INSERT INTO modalities (name, require_classroom, status, configurations, university_id) VALUES 
('Presencial', 1, 1, '{"allowed_days": [1, 2, 3, 4, 5], "classroom_days_per_week": 5}', @utez_id), 
('En línea', 0, 1, '{"allowed_days": [1, 2, 3, 4, 5], "classroom_days_per_week": 0}', @utez_id), 
('Mixta', 1, 1, '{"allowed_days": [1, 2, 3, 4, 5], "classroom_days_per_week": 3}', @utez_id);

-- -----------------------------------------------------
/*            TABLA DE PERIODOS ACADÉMICOS          */
-- -----------------------------------------------------
-- Nota: `academic_periods.university_id` tiene FK a `universities.id`.
-- Este seed inserta filas solo si existe la universidad con id=1.
INSERT INTO academic_periods
  (name, university_id, start_month, end_month, year, `order`, is_active, is_deleted)
SELECT
  'Mayo - Agosto', u.id, 5, 8, 2026, 1, 1, 0
FROM universities u
WHERE u.id = @utez_id;

INSERT INTO academic_periods
  (name, university_id, start_month, end_month, year, `order`, is_active, is_deleted)
SELECT
  'Septiembre - Diciembre', u.id, 9, 12, 2026, 2, 0, 0
FROM universities u
WHERE u.id = @utez_id;



-- -----------------------------------------------------
/*               TABLA DE CARRERAS                 */
-- -----------------------------------------------------
INSERT INTO careers (name, university_id, short_name, code, modality_id, total_periods, status, is_deleted) VALUES
('Licenciatura en Administración',                    @utez_id, 'LA',    'LA-001',  1, 9, 1, 0),
('Licenciatura en Contaduría',                        @utez_id, 'LC',    'LC-001',  1, 9, 1, 0),
('Licenciatura en Negocios y Mercadotecnia',          @utez_id, 'LNM',   'LNM-001', 1, 9, 1, 0),
('Licenciatura en Diseño Digital y Producción Audiovisual', @utez_id, 'LDDPA', 'LDDPA-001', 1, 9, 1, 0),
('Licenciatura en Gestión del Bienestar',             @utez_id, 'LGB',   'LGB-001', 1, 9, 1, 0),
('Licenciatura en Terapia Física',                    @utez_id, 'LTF',   'LTF-001', 1, 9, 1, 0),
('Ingeniería en Tecnologías de la Información e Innovación Digital', @utez_id, 'ITIID', 'ITIID-001', 1, 9, 1, 0),
('Ingeniería en Diseño Textil y Moda',               @utez_id, 'IDTM',  'IDTM-001', 1, 9, 1, 0),
('Ingeniería Industrial',                             @utez_id, 'II',    'II-001',   1, 9, 1, 0),
('Ingeniería Mecatrónica',                            @utez_id, 'IM',    'IM-001',   1, 9, 1, 0),
('Ingeniería en Mantenimiento Industrial',            @utez_id, 'IMI',   'IMI-001',  1, 9, 1, 0),
('Ingeniería en Nanotecnología',                      @utez_id, 'IN',    'IN-001',   1, 9, 1, 0);


-- -----------------------------------------------------
/*               TABLA DE PROFESORES               */
-- -----------------------------------------------------
INSERT INTO teachers (name, surname, last_name, require_classroom, status, is_deleted) VALUES
('Carlos',    'García',     'Vega',      1, 1, 0),
('María',     'Martínez',   'Castillo',  0, 1, 0),
('José',      'López',      NULL,        1, 1, 0),
('Ana',       'Sánchez',    'Moreno',    0, 1, 0),
('Luis',      'Ramírez',    'Romero',    1, 1, 0),
('Laura',     'Torres',     NULL,        0, 1, 0),
('Miguel',    'Flores',     'Alvarado',  1, 1, 1),
('Sofía',     'Rivera',     'Mendoza',   0, 1, 0),
('Jorge',     'Gómez',      'Ramos',     1, 1, 0),
('Elena',     'Díaz',       NULL,        0, 1, 0),
('Fernando',  'Morales',    'Gutiérrez', 1, 1, 0),
('Patricia',  'Reyes',      'Vargas',    0, 1, 0),
('Roberto',   'Cruz',       NULL,        1, 1, 1),
('Isabel',    'Hernández',  'Castro',    0, 1, 0),
('Alejandro', 'Pérez',      'Ortega',    1, 1, 0),
('Valentina', 'Jiménez',    NULL,        0, 1, 0),
('Ricardo',   'García',     'Ruiz',      1, 1, 0),
('Gabriela',  'Martínez',   'Aguilar',   0, 1, 0),
('Carlos',    'López',      'Medina',    1, 1, 0),
('María',     'Sánchez',    NULL,        0, 1, 0);


-- -----------------------------------------------------
/*           TABLA DE TIPOS DE AULA                 */
-- -----------------------------------------------------

INSERT INTO classroom_types (name, description, status, is_deleted) VALUES
('CompuAula',   NULL, 1, 0),
('Aula',        NULL, 1, 0),
('Laboratoria', NULL, 1, 0);


-- -----------------------------------------------------
/*               TABLA DE AULAS (CLASSROOMS)        */
-- -----------------------------------------------------

INSERT INTO classrooms (name, classroom_type_id, code, floor, building, building_code, universities_id, is_restricted, status, is_deleted) VALUES
  ('Aula 101',        2, 'A-101', 1, 'Edificio A', 'A', @utez_id, 0, 1, 0),
  ('Aula 102',        2, 'A-102', 1, 'Edificio A', 'A', @utez_id, 0, 1, 0),
  ('CompuAula 201',   1, 'CA-201', 2, 'Edificio B', 'B', @utez_id, 0, 1, 0),
  ('Laboratorio Física', 3, 'LAB-FIS', 1, 'Edificio C', 'C', @utez_id, 1, 1, 0);
