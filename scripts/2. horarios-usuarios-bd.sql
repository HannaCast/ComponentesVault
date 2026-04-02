-- ============================================================
-- CREACIÓN DE USUARIOS Y ASIGNACIÓN DE PERMISOS PARA LA API
-- ============================================================

-- 1. Crear el usuario
CREATE USER IF NOT EXISTS 'api_user'@'%' IDENTIFIED BY 'api_password';

-- 2. Permisos completos en todas las tablas (excepto audit_logs)
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.roles TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.users TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.images TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.period_types TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.universities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.colors TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.subjects TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.academic_periods TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.modalities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.careers TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.career_period_exceptions TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.career_subjects TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.shifts TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.groups TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.teachers TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.teacher_availabilities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.teachers_subjects TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.teachers_universities TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.classroom_types TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.classrooms TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.classroom_careers TO 'api_user'@'%';
GRANT SELECT, INSERT, UPDATE ON cdi_horarios.user_configurations TO 'api_user'@'%';

-- 3. audit_logs solo lectura
GRANT SELECT ON cdi_horarios.audit_logs TO 'api_user'@'%';

-- 4. Aplicar cambios
FLUSH PRIVILEGES;