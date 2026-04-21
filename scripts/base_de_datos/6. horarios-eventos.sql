-- ============================================================
--  EVENTOS PROGRAMADOS DE MANTENIMIENTO - dci_horarios (MySQL)
-- ============================================================
--
-- Objetivo:
--   Ejecutar tareas periodicas de limpieza para evitar crecimiento
--   innecesario en tablas operativas.
--
-- Eventos definidos:
--   1) Purga de tokens expirados no usados.
--   2) Purga de borradores soft-delete antiguos en schedule_versions.
-- ============================================================

USE dci_horarios;

-- Elimina tokens que han expirado y no han sido usados para mantener la tabla user_tokens limpia.
DROP EVENT IF EXISTS evt_purge_expired_tokens;
CREATE EVENT evt_purge_expired_tokens
ON SCHEDULE EVERY 1 HOUR
DO
    DELETE FROM user_tokens 
    WHERE expires_at < NOW() 
      AND used_at IS NULL;


-- Elimina borradores soft-delete antiguos en schedule_versions para mantener la tabla limpia.
DROP EVENT IF EXISTS evt_purge_soft_deleted_draft_versions;
CREATE EVENT evt_purge_soft_deleted_draft_versions
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '02:00:00')
DO
    DELETE FROM schedule_versions
    WHERE is_deleted = 1
      AND is_confirmed = 0
      AND COALESCE(updated_at, created_at) < NOW() - INTERVAL 90 DAY;