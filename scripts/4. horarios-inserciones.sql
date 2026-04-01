USE cdi_horarios;

-----------------------------------------------------
/*    TABLA DE COLORES PARA MATERIAS               */
-----------------------------------------------------
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



------------------------------------------------------
/*    TABLA DE MODALIDADES DE CLASES               */
------------------------------------------------------

INSERT INTO modalities (name, require_classroom, status, configurations, university_id) VALUES 
('Presencial', 1, 1, '{"allowed_days": [1, 2, 3, 4, 5], "classroom_days_per_week": 5}', 1), 
('En línea', 0, 1, '{"allowed_days": [1, 2, 3, 4, 5], "classroom_days_per_week": 0}', 1), 
('Mixta', 1, 1, '{"allowed_days": [1, 2, 3, 4, 5], "classroom_days_per_week": 3}', 1);



-----------------------------------------------------
/*               TABLA DE CARRERAS                 */
-----------------------------------------------------
INSERT INTO careers (name, university_id, short_name, code, modality_id, total_periods, status, is_deleted) VALUES
('Licenciatura en Administración',                    1, 'LA',    'LA-001',  1, 9, 1, 0),
('Licenciatura en Contaduría',                        1, 'LC',    'LC-001',  1, 9, 1, 0),
('Licenciatura en Negocios y Mercadotecnia',          1, 'LNM',   'LNM-001', 1, 9, 1, 0),
('Licenciatura en Diseño Digital y Producción Audiovisual', 1, 'LDDPA', 'LDDPA-001', 1, 9, 1, 0),
('Licenciatura en Gestión del Bienestar',             1, 'LGB',   'LGB-001', 1, 9, 1, 0),
('Licenciatura en Terapia Física',                    1, 'LTF',   'LTF-001', 1, 9, 1, 0),
('Ingeniería en Tecnologías de la Información e Innovación Digital', 1, 'ITIID', 'ITIID-001', 1, 9, 1, 0),
('Ingeniería en Diseño Textil y Moda',               1, 'IDTM',  'IDTM-001', 1, 9, 1, 0),
('Ingeniería Industrial',                             1, 'II',    'II-001',   1, 9, 1, 0),
('Ingeniería Mecatrónica',                            1, 'IM',    'IM-001',   1, 9, 1, 0),
('Ingeniería en Mantenimiento Industrial',            1, 'IMI',   'IMI-001',  1, 9, 1, 0),
('Ingeniería en Nanotecnología',                      1, 'IN',    'IN-001',   1, 9, 1, 0);


-----------------------------------------------------
/*               TABLA DE PROFESORES               */
-----------------------------------------------------
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


-----------------------------------------------------
/*           TABLA DE TIPOS DE AULA                 */
-----------------------------------------------------

INSERT INTO classroom_types (name, description, status, is_deleted) VALUES
('CompuAula',   NULL, 1, 0),
('Aula',        NULL, 1, 0),
('Laboratoria', NULL, 1, 0);


-----------------------------------------------------
/*               TABLA DE AULAS (CLASSROOMS)        */
-----------------------------------------------------

INSERT INTO classrooms (name, classroom_type_id, code, floor, building, building_code, universities_id, is_restricted, status, is_deleted) VALUES
  ('Aula 101',        2, 'A-101', 1, 'Edificio A', 'A', 1, 0, 1, 0),
  ('Aula 102',        2, 'A-102', 1, 'Edificio A', 'A', 1, 0, 1, 0),
  ('CompuAula 201',   1, 'CA-201', 2, 'Edificio B', 'B', 1, 0, 1, 0),
  ('Laboratorio Física', 3, 'LAB-FIS', 1, 'Edificio C', 'C', 1, 1, 1, 0);