USE cdi_horarios;

-- -----------------------------------------------------
/*  CATALOGOS BASE DE SISTEMA                          */
-- -----------------------------------------------------

INSERT INTO roles (name)
SELECT 'admin'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'admin'
);

INSERT INTO roles (name)
SELECT 'usuario'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'usuario'
);

INSERT INTO period_types (name, code, months_duration, status)
SELECT 'Cuatrimestre', 'CUAT', 4, 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM period_types WHERE code = 'CUAT'
);

INSERT INTO period_types (name, code, months_duration, status)
SELECT 'Semestre', 'SEM', 6, 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM period_types WHERE code = 'SEM'
);

INSERT INTO period_types (name, code, months_duration, status)
SELECT 'Trimestre', 'TRIM', 3, 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM period_types WHERE code = 'TRIM'
);

INSERT INTO period_types (name, code, months_duration, status)
SELECT 'Anual', 'ANUAL', 12, 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM period_types WHERE code = 'ANUAL'
);

INSERT INTO colors (name, hex, contrast_hex, status, is_deleted)
SELECT c.name, c.hex, c.contrast_hex, 1, 0
FROM (
  SELECT 'Blanco' AS name, 'FFFFFF' AS hex, '111827' AS contrast_hex
  UNION ALL SELECT 'Rojo', 'EF4444', 'FFFFFF'
  UNION ALL SELECT 'Naranja', 'F97316', '111827'
  UNION ALL SELECT 'Esmeralda', '10B981', '111827'
  UNION ALL SELECT 'Azul', '3B82F6', 'FFFFFF'
  UNION ALL SELECT 'Purpura', '8B5CF6', 'FFFFFF'
  UNION ALL SELECT 'Rosa', 'EC4899', '111827'
  UNION ALL SELECT 'Turquesa', '14B8A6', '111827'
  UNION ALL SELECT 'Naranja oscuro', 'FF8C42', '111827'
  UNION ALL SELECT 'Indigo', '5B6FFF', 'FFFFFF'
  UNION ALL SELECT 'Lima', '84CC16', '111827'
  UNION ALL SELECT 'Gris oscuro', '374151', 'F9FAFB'
) AS c
LEFT JOIN colors existing ON existing.name = c.name AND existing.is_deleted = 0
WHERE existing.id IS NULL;

INSERT INTO classroom_types (name, description, status, is_deleted)
SELECT ct.name, ct.description, 1, 0
FROM (
  SELECT 'CompuAula' AS name, 'Aula de computo' AS description
  UNION ALL SELECT 'Aula', 'Salon teorico'
  UNION ALL SELECT 'Laboratorio', 'Espacio practico especializado'
) AS ct
LEFT JOIN classroom_types existing ON existing.name = ct.name AND existing.is_deleted = 0
WHERE existing.id IS NULL;

-- Este script contiene unicamente catalogos base de sistema.
-- Los datos de prueba se encuentran en: 6. horarios-datos-prueba.sql
