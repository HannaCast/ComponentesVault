-- ============================================================
-- CREACIÓN DE USUARIOS Y ASIGNACIÓN DE PERMISOS PARA LA API
-- ============================================================

-- 1. Crear el usuario
CREATE USER IF NOT EXISTS 'api_user'@'%' IDENTIFIED BY 'api_password';

-- 2. Permisos completos en todas las tablas (excepto audit_logs)
GRANT SELECT, INSERT, UPDATE ON dci_horarios.roles TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.users TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.images TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.period_types TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.universities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.colors TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.subjects TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.academic_periods TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.modalities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.careers TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.career_period_exceptions TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.career_subjects TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.shifts TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.groups TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.teachers TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.teacher_availabilities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.teachers_subjects TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.teachers_universities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.classroom_types TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.classrooms TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.classroom_careers TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON dci_horarios.user_configurations TO 'api_user'@'%';

-- 3. audit_logs solo lectura
GRANT SELECT ON dci_horarios.audit_logs TO 'api_user'@'%';

-- 4. Aplicar cambios
FLUSH PRIVILEGES;