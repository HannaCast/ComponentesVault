-- ============================================================
--  INDICES ADICIONALES DE RENDIMIENTO - dci_horarios (MySQL)
-- ============================================================
--
-- Objetivo:
--   Agregar indices compuestos para acelerar consultas frecuentes
--   en modulos de generacion de horarios y periodos academicos.
--
-- Alcance:
--   1) schedule_versions: borrador activo por universidad
--   2) academic_periods: periodo activo por universidad
-- ============================================================

USE dci_horarios;

-- Optimiza busquedas de borrador activo y operaciones de limpieza en schedule_versions.
CREATE INDEX idx_schedule_versions_uni_del_conf_id
ON schedule_versions (university_id, is_deleted, is_confirmed, id);

-- Optimiza resolucion del periodo activo por universidad y listados filtrados.
CREATE INDEX idx_academic_periods_uni_del_active_id
ON academic_periods (university_id, is_deleted, is_active, id);
