-- ============================================================
--  TRIGGERS DE TIMESTAMPS Y AUTORÍA PARA TODAS LAS TABLAS
-- ============================================================
--  Rellena automáticamente created_at, created_by,
--  updated_at, updated_by en cada INSERT / UPDATE.
--
--  PRIORIDAD del campo created_by / updated_by:
--    1. @app_username  → usuario autenticado en la app
--    2. USER()         → usuario de conexión a BD (fallback)
--
--  Desde el backend (middleware):
--    SET @app_username = 'email@ejemplo.com';
--
--  Proceso interno sin usuario HTTP:
--    SET @app_username = 'SYSTEM';
--
--  Sin ningún SET (seed, migración, conexión directa):
--    El trigger usa USER() → ej: 'root@localhost'
-- ============================================================

USE `cdi_horarios`;

DELIMITER $$

-- ------------------------------------------------------------
--  roles
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_roles_before_insert$$
CREATE TRIGGER trg_roles_before_insert
BEFORE INSERT ON `roles` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_roles_before_update$$
CREATE TRIGGER trg_roles_before_update
BEFORE UPDATE ON `roles` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  users
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_users_before_insert$$
CREATE TRIGGER trg_users_before_insert
BEFORE INSERT ON `users` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_users_before_update$$
CREATE TRIGGER trg_users_before_update
BEFORE UPDATE ON `users` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  images
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_images_before_insert$$
CREATE TRIGGER trg_images_before_insert
BEFORE INSERT ON `images` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_images_before_update$$
CREATE TRIGGER trg_images_before_update
BEFORE UPDATE ON `images` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  period_types
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_period_types_before_insert$$
CREATE TRIGGER trg_period_types_before_insert
BEFORE INSERT ON `period_types` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_period_types_before_update$$
CREATE TRIGGER trg_period_types_before_update
BEFORE UPDATE ON `period_types` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  universities
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_universities_before_insert$$
CREATE TRIGGER trg_universities_before_insert
BEFORE INSERT ON `universities` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_universities_before_update$$
CREATE TRIGGER trg_universities_before_update
BEFORE UPDATE ON `universities` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  colors
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_colors_before_insert$$
CREATE TRIGGER trg_colors_before_insert
BEFORE INSERT ON `colors` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_colors_before_update$$
CREATE TRIGGER trg_colors_before_update
BEFORE UPDATE ON `colors` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  subjects
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_subjects_before_insert$$
CREATE TRIGGER trg_subjects_before_insert
BEFORE INSERT ON `subjects` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_subjects_before_update$$
CREATE TRIGGER trg_subjects_before_update
BEFORE UPDATE ON `subjects` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  academic_periods
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_academic_periods_before_insert$$
CREATE TRIGGER trg_academic_periods_before_insert
BEFORE INSERT ON `academic_periods` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_academic_periods_before_update$$
CREATE TRIGGER trg_academic_periods_before_update
BEFORE UPDATE ON `academic_periods` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  modalities
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_modalities_before_insert$$
CREATE TRIGGER trg_modalities_before_insert
BEFORE INSERT ON `modalities` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_modalities_before_update$$
CREATE TRIGGER trg_modalities_before_update
BEFORE UPDATE ON `modalities` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  careers
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_careers_before_insert$$
CREATE TRIGGER trg_careers_before_insert
BEFORE INSERT ON `careers` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_careers_before_update$$
CREATE TRIGGER trg_careers_before_update
BEFORE UPDATE ON `careers` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  career_period_exceptions
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_career_period_exceptions_before_insert$$
CREATE TRIGGER trg_career_period_exceptions_before_insert
BEFORE INSERT ON `career_period_exceptions` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_career_period_exceptions_before_update$$
CREATE TRIGGER trg_career_period_exceptions_before_update
BEFORE UPDATE ON `career_period_exceptions` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  career_subjects
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_career_subjects_before_insert$$
CREATE TRIGGER trg_career_subjects_before_insert
BEFORE INSERT ON `career_subjects` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_career_subjects_before_update$$
CREATE TRIGGER trg_career_subjects_before_update
BEFORE UPDATE ON `career_subjects` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  shifts
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_shifts_before_insert$$
CREATE TRIGGER trg_shifts_before_insert
BEFORE INSERT ON `shifts` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_shifts_before_update$$
CREATE TRIGGER trg_shifts_before_update
BEFORE UPDATE ON `shifts` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  groups
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_groups_before_insert$$
CREATE TRIGGER trg_groups_before_insert
BEFORE INSERT ON `groups` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_groups_before_update$$
CREATE TRIGGER trg_groups_before_update
BEFORE UPDATE ON `groups` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  teachers
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_teachers_before_insert$$
CREATE TRIGGER trg_teachers_before_insert
BEFORE INSERT ON `teachers` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_teachers_before_update$$
CREATE TRIGGER trg_teachers_before_update
BEFORE UPDATE ON `teachers` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  teacher_availabilities
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_teacher_availabilities_before_insert$$
CREATE TRIGGER trg_teacher_availabilities_before_insert
BEFORE INSERT ON `teacher_availabilities` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_teacher_availabilities_before_update$$
CREATE TRIGGER trg_teacher_availabilities_before_update
BEFORE UPDATE ON `teacher_availabilities` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  teachers_subjects
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_teachers_subjects_before_insert$$
CREATE TRIGGER trg_teachers_subjects_before_insert
BEFORE INSERT ON `teachers_subjects` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_teachers_subjects_before_update$$
CREATE TRIGGER trg_teachers_subjects_before_update
BEFORE UPDATE ON `teachers_subjects` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  teachers_universities
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_teachers_universities_before_insert$$
CREATE TRIGGER trg_teachers_universities_before_insert
BEFORE INSERT ON `teachers_universities` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_teachers_universities_before_update$$
CREATE TRIGGER trg_teachers_universities_before_update
BEFORE UPDATE ON `teachers_universities` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  classroom_types
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_classroom_types_before_insert$$
CREATE TRIGGER trg_classroom_types_before_insert
BEFORE INSERT ON `classroom_types` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_classroom_types_before_update$$
CREATE TRIGGER trg_classroom_types_before_update
BEFORE UPDATE ON `classroom_types` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  classrooms
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_classrooms_before_insert$$
CREATE TRIGGER trg_classrooms_before_insert
BEFORE INSERT ON `classrooms` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_classrooms_before_update$$
CREATE TRIGGER trg_classrooms_before_update
BEFORE UPDATE ON `classrooms` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  classroom_careers
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_classroom_careers_before_insert$$
CREATE TRIGGER trg_classroom_careers_before_insert
BEFORE INSERT ON `classroom_careers` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_classroom_careers_before_update$$
CREATE TRIGGER trg_classroom_careers_before_update
BEFORE UPDATE ON `classroom_careers` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  user_configurations
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_user_configurations_before_insert$$
CREATE TRIGGER trg_user_configurations_before_insert
BEFORE INSERT ON `user_configurations` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_user_configurations_before_update$$
CREATE TRIGGER trg_user_configurations_before_update
BEFORE UPDATE ON `user_configurations` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

-- ------------------------------------------------------------
--  schedule_versions
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_schedule_versions_before_insert$$
CREATE TRIGGER trg_schedule_versions_before_insert
BEFORE INSERT ON `schedule_versions` FOR EACH ROW
BEGIN
  SET NEW.created_at = NOW();
  SET NEW.created_by = COALESCE(@app_username, USER());
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DROP TRIGGER IF EXISTS trg_schedule_versions_before_update$$
CREATE TRIGGER trg_schedule_versions_before_update
BEFORE UPDATE ON `schedule_versions` FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
  SET NEW.updated_by = COALESCE(@app_username, USER());
END$$

DELIMITER ;