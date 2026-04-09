-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema cdi_horarios
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema cdi_horarios
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `cdi_horarios` DEFAULT CHARACTER SET utf8 ;
USE `cdi_horarios` ;

-- -----------------------------------------------------
-- Table `cdi_horarios`.`roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `surname` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `role_id` INT NOT NULL,
  `last_login` DATETIME NULL,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_user_role_idx` (`role_id` ASC) VISIBLE,
  CONSTRAINT `fk_user_role`
    FOREIGN KEY (`role_id`)
    REFERENCES `cdi_horarios`.`roles` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`images`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`images` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `image_name` VARCHAR(45) NOT NULL,
  `mime_type` VARCHAR(45) NOT NULL,
  `extension` VARCHAR(10) NOT NULL,
  `sha256` VARCHAR(64) NOT NULL,
  `file_size` INT NOT NULL,
  `image_path` VARCHAR(100) NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`period_types`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`period_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `code` VARCHAR(45) NOT NULL,
  `months_duration` INT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`universities`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`universities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `short_name` VARCHAR(10) NULL,
  `institution_code` VARCHAR(45) NULL,
  `image_id` INT NULL,
  `user_id` INT NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `period_type_id` INT NOT NULL,
  `uses_period_groups` TINYINT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_universities_images1_idx` (`image_id` ASC) VISIBLE,
  INDEX `fk_universities_users1_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_universities_period_types1_idx` (`period_type_id` ASC) VISIBLE,
  CONSTRAINT `fk_universities_images1`
    FOREIGN KEY (`image_id`)
    REFERENCES `cdi_horarios`.`images` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_universities_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `cdi_horarios`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_universities_period_types1`
    FOREIGN KEY (`period_type_id`)
    REFERENCES `cdi_horarios`.`period_types` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`colors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`colors` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `hex` VARCHAR(6) NOT NULL,
  `contrast_hex` VARCHAR(6) NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`subjects`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`subjects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `short_name` VARCHAR(10) NULL,
  `code` VARCHAR(50) NULL,
  `description` VARCHAR(45) NULL,
  `hours_per_week` INT NOT NULL,
  `color_id` INT NOT NULL,
  `university_id` INT NOT NULL,
  `is_restricted_to_classroom_types` TINYINT NOT NULL DEFAULT 0,
  `is_mandatory` TINYINT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_subjects_colors1_idx` (`color_id` ASC) VISIBLE,
  INDEX `fk_subjects_universities1_idx` (`university_id` ASC) VISIBLE,
  CONSTRAINT `fk_subjects_colors1`
    FOREIGN KEY (`color_id`)
    REFERENCES `cdi_horarios`.`colors` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_subjects_universities1`
    FOREIGN KEY (`university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`academic_periods`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`academic_periods` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `university_id` INT NOT NULL,
  `start_month` INT NOT NULL,
  `end_month` INT NOT NULL,
  `year` INT NULL,
  `order` INT NULL,
  `is_active` TINYINT NULL DEFAULT 0,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_academic_periods_universities1_idx` (`university_id` ASC) VISIBLE,
  CONSTRAINT `fk_academic_periods_universities1`
    FOREIGN KEY (`university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`modalities`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`modalities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `require_classroom` TINYINT NOT NULL DEFAULT 1,
  `status` TINYINT NOT NULL DEFAULT 1,
  `configurations` JSON NOT NULL,
  `university_id` INT NOT NULL,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_modalities_universities1_idx` (`university_id` ASC) VISIBLE,
  CONSTRAINT `fk_modalities_universities1`
    FOREIGN KEY (`university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`careers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`careers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `university_id` INT NOT NULL,
  `short_name` VARCHAR(20) NULL,
  `code` VARCHAR(50) NULL,
  `modality_id` INT NOT NULL,
  `total_periods` INT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_careers_universities1_idx` (`university_id` ASC) VISIBLE,
  INDEX `fk_careers_modalities1_idx` (`modality_id` ASC) VISIBLE,
  CONSTRAINT `fk_careers_universities1`
    FOREIGN KEY (`university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_careers_modalities1`
    FOREIGN KEY (`modality_id`)
    REFERENCES `cdi_horarios`.`modalities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`career_period_exceptions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`career_period_exceptions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `career_id` INT NOT NULL,
  `period_number` INT NOT NULL,
  `reason` VARCHAR(255) NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_career_period_exceptions_careers1_idx` (`career_id` ASC) VISIBLE,
  CONSTRAINT `fk_career_period_exceptions_careers1`
    FOREIGN KEY (`career_id`)
    REFERENCES `cdi_horarios`.`careers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`career_subjects`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`career_subjects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subjects_id` INT NOT NULL,
  `careers_id` INT NOT NULL,
  `period_number` INT NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  INDEX `fk_subjects_has_careers_careers1_idx` (`careers_id` ASC) VISIBLE,
  INDEX `fk_subjects_has_careers_subjects1_idx` (`subjects_id` ASC) VISIBLE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_subjects_has_careers_subjects1`
    FOREIGN KEY (`subjects_id`)
    REFERENCES `cdi_horarios`.`subjects` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_subjects_has_careers_careers1`
    FOREIGN KEY (`careers_id`)
    REFERENCES `cdi_horarios`.`careers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`shifts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`shifts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `university_id` INT NOT NULL,
  `order` INT NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_shifts_universities1_idx` (`university_id` ASC) VISIBLE,
  CONSTRAINT `fk_shifts_universities1`
    FOREIGN KEY (`university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`groups`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`groups` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `career_id` INT NOT NULL,
  `period_number` INT NOT NULL,
  `letter` VARCHAR(1) NOT NULL,
  `shift_id` INT NOT NULL,
  `academic_period_id` INT NULL,
  `university_id` INT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_groups_careers1_idx` (`career_id` ASC) VISIBLE,
  INDEX `fk_groups_shifts1_idx` (`shift_id` ASC) VISIBLE,
  INDEX `fk_groups_academic_periods1_idx` (`academic_period_id` ASC) VISIBLE,
  INDEX `fk_groups_universities1_idx` (`university_id` ASC) VISIBLE,
  CONSTRAINT `fk_groups_careers1`
    FOREIGN KEY (`career_id`)
    REFERENCES `cdi_horarios`.`careers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_groups_shifts1`
    FOREIGN KEY (`shift_id`)
    REFERENCES `cdi_horarios`.`shifts` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_groups_academic_periods1`
    FOREIGN KEY (`academic_period_id`)
    REFERENCES `cdi_horarios`.`academic_periods` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_groups_universities1`
    FOREIGN KEY (`university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`teachers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`teachers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `surname` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NULL,
  `require_classroom` TINYINT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`teacher_availabilities`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`teacher_availabilities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teacher_id` INT NOT NULL,
  `day_of_week` INT NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_available` TINYINT NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_teacher_availabilities_teachers1_idx` (`teacher_id` ASC) VISIBLE,
  CONSTRAINT `fk_teacher_availabilities_teachers1`
    FOREIGN KEY (`teacher_id`)
    REFERENCES `cdi_horarios`.`teachers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`teachers_subjects`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`teachers_subjects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teachers_id` INT NOT NULL,
  `subjects_id` INT NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  INDEX `fk_teachers_has_subjects_subjects1_idx` (`subjects_id` ASC) VISIBLE,
  INDEX `fk_teachers_has_subjects_teachers1_idx` (`teachers_id` ASC) VISIBLE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_teachers_has_subjects_teachers1`
    FOREIGN KEY (`teachers_id`)
    REFERENCES `cdi_horarios`.`teachers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_teachers_has_subjects_subjects1`
    FOREIGN KEY (`subjects_id`)
    REFERENCES `cdi_horarios`.`subjects` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`audit_logs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `username` VARCHAR(100) NULL,
  `source` VARCHAR(20) NULL,
  `transaction_id` VARCHAR(36) NULL,
  `table_name` VARCHAR(100) NOT NULL,
  `record_id` INT NULL,
  `action` ENUM("CREATE", "UPDATE", "DELETE", "INSERT", "CHANGE_STATUS") NOT NULL,
  `old_data` JSON NOT NULL,
  `new_data` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `is_succesfull` TINYINT NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`teachers_universities`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`teachers_universities` (
  `id` INT NOT NULL,
  `teachers_id` INT NOT NULL,
  `universities_id` INT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  INDEX `fk_teachers_has_universities_universities1_idx` (`universities_id` ASC) VISIBLE,
  INDEX `fk_teachers_has_universities_teachers1_idx` (`teachers_id` ASC) VISIBLE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_teachers_has_universities_teachers1`
    FOREIGN KEY (`teachers_id`)
    REFERENCES `cdi_horarios`.`teachers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_teachers_has_universities_universities1`
    FOREIGN KEY (`universities_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`classroom_types`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`classroom_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`classrooms`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`classrooms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `classroom_type_id` INT NOT NULL,
  `code` VARCHAR(20) NULL,
  `floor` INT NULL,
  `building` VARCHAR(50) NULL,
  `building_code` VARCHAR(20) NULL,
  `universities_id` INT NOT NULL,
  `is_restricted` TINYINT NOT NULL DEFAULT 0,
  `is_restricted_to_subjects` TINYINT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_classrooms_classroom_types1_idx` (`classroom_type_id` ASC) VISIBLE,
  INDEX `fk_classrooms_universities1_idx` (`universities_id` ASC) VISIBLE,
  CONSTRAINT `fk_classrooms_classroom_types1`
    FOREIGN KEY (`classroom_type_id`)
    REFERENCES `cdi_horarios`.`classroom_types` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_classrooms_universities1`
    FOREIGN KEY (`universities_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`classroom_careers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`classroom_careers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `careers_id` INT NOT NULL,
  `classrooms_id` INT NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_classroom_careers_careers1_idx` (`careers_id` ASC) VISIBLE,
  INDEX `fk_classroom_careers_classrooms1_idx` (`classrooms_id` ASC) VISIBLE,
  CONSTRAINT `fk_classroom_careers_careers1`
    FOREIGN KEY (`careers_id`)
    REFERENCES `cdi_horarios`.`careers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_classroom_careers_classrooms1`
    FOREIGN KEY (`classrooms_id`)
    REFERENCES `cdi_horarios`.`classrooms` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`user_configurations`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`user_configurations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `selected_university_id` INT NULL,
  `theme` VARCHAR(10) NOT NULL DEFAULT 'light' COMMENT 'El tema de la aplicación, ya sea oscuro (dark) o blanco (light)',
  `accent` VARCHAR(10) NOT NULL DEFAULT 'blue' COMMENT 'el color de la interfaz, ejemplo, rojo, verde, azul',
  `schedule_generation` JSON NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_user_configurations_users1_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_user_configurations_universities1_idx` (`selected_university_id` ASC) VISIBLE,
  CONSTRAINT `fk_user_configurations_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `cdi_horarios`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_configurations_universities1`
    FOREIGN KEY (`selected_university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`schedule_versions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`schedule_versions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `university_id` INT NOT NULL,
  `academic_period_id` INT NULL,
  `parameters` JSON NOT NULL,
  `data` JSON NOT NULL,
  `assigned_count` INT NOT NULL,
  `unassigned_count` INT NOT NULL,
  `is_confirmed` TINYINT NOT NULL DEFAULT 0,
  `confirmed_at` DATETIME NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_schedule_versions_universities1_idx` (`university_id` ASC) VISIBLE,
  INDEX `fk_schedule_versions_academic_periods1_idx` (`academic_period_id` ASC) VISIBLE,
  CONSTRAINT `fk_schedule_versions_universities1`
    FOREIGN KEY (`university_id`)
    REFERENCES `cdi_horarios`.`universities` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_schedule_versions_academic_periods1`
    FOREIGN KEY (`academic_period_id`)
    REFERENCES `cdi_horarios`.`academic_periods` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`classroom_subjects`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`classroom_subjects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subject_id` INT NOT NULL,
  `classroom_id` INT NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_classroom_careers_classrooms1_idx` (`classroom_id` ASC) VISIBLE,
  INDEX `fk_classroom_subjects_subjects1_idx` (`subject_id` ASC) VISIBLE,
  CONSTRAINT `fk_classroom_careers_classrooms10`
    FOREIGN KEY (`classroom_id`)
    REFERENCES `cdi_horarios`.`classrooms` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_classroom_subjects_subjects1`
    FOREIGN KEY (`subject_id`)
    REFERENCES `cdi_horarios`.`subjects` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cdi_horarios`.`subjects_classroom_types`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdi_horarios`.`subjects_classroom_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subject_id` INT NOT NULL,
  `classroom_type_id` INT NOT NULL,
  `is_deleted` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NULL,
  `created_by` VARCHAR(100) NULL,
  `updated_at` DATETIME NULL,
  `updated_by` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_classroom_subjects_subjects1_idx` (`subject_id` ASC) VISIBLE,
  INDEX `fk_subjects_classroom_types_classroom_types1_idx` (`classroom_type_id` ASC) VISIBLE,
  CONSTRAINT `fk_classroom_subjects_subjects10`
    FOREIGN KEY (`subject_id`)
    REFERENCES `cdi_horarios`.`subjects` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_subjects_classroom_types_classroom_types1`
    FOREIGN KEY (`classroom_type_id`)
    REFERENCES `cdi_horarios`.`classroom_types` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;