USE `cdi_horarios`;
-- ============================================================
--  TRIGGERS DE AUDITORÍA → audit_logs - cdi_horarios (MySQL)
-- ============================================================
--
--  LÓGICA DE source:
--    USER() = 'api_user@...' → source = 'APPLICATION'
--    Cualquier otro usuario  → source = 'DATABASE'
--
--  LÓGICA DE action:
--    DATABASE  → INSERT='CREATE'   | UPDATE='UPDATE' | DELETE='DELETE'
--    APPLICATION → Usa @app_action si viene seteado, si no:
--                  INSERT='INSERT' | UPDATE='UPDATE' | DELETE='DELETE'
--                  @app_action también puede ser 'CHANGE_STATUS'
--
--  VARIABLES DE SESIÓN (settear desde el backend):
--    SET @app_user_id        = <id>;
--    SET @app_username       = 'email@ejemplo.com';
--    SET @app_ip             = '<ip>';
--    SET @app_user_agent     = '<user_agent>';
--    SET @app_transaction_id = UUID();
--    SET @app_action         = 'CHANGE_STATUS';  -- solo cuando aplique
--
--  IMPORTANTE: Resetear @app_action después de cada operación especial:
--    SET @app_action = NULL;
-- ============================================================

USE `cdi_horarios`;

-- Expandir el ENUM para incluir los nuevos valores de la app
ALTER TABLE `audit_logs`
  MODIFY COLUMN `action` ENUM('CREATE','UPDATE','DELETE','INSERT','CHANGE_STATUS') NOT NULL;

DELIMITER $$

-- ============================================================
--  roles
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_roles_after_insert$$
CREATE TRIGGER trg_audit_roles_after_insert
AFTER INSERT ON `roles` FOR EACH ROW
BEGIN
  DECLARE v_source  VARCHAR(20);
  DECLARE v_action  VARCHAR(20);
  DECLARE v_is_app  TINYINT;

  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1) = 'api_user', 1, 0);
  SET v_source = IF(v_is_app, 'APPLICATION', 'DATABASE');
  SET v_action = IF(v_is_app, COALESCE(@app_action, 'INSERT'), 'CREATE');

  INSERT INTO `audit_logs`
    (user_id, username, source, transaction_id, table_name, record_id, action,
     old_data, new_data, ip_address, user_agent, is_succesfull, created_at)
  VALUES (
    IF(v_is_app, @app_user_id, NULL),
    IF(v_is_app, COALESCE(@app_username, USER()), USER()),
    v_source,
    IF(v_is_app, @app_transaction_id, NULL),
    'roles', NEW.id, v_action,
    JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,
      'created_at',NEW.created_at,'created_by',NEW.created_by,
      'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app, @app_ip, NULL),
    IF(v_is_app, @app_user_agent, NULL),
    1, NOW()
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_roles_after_update$$
CREATE TRIGGER trg_audit_roles_after_update
AFTER UPDATE ON `roles` FOR EACH ROW
BEGIN
  DECLARE v_source  VARCHAR(20);
  DECLARE v_action  VARCHAR(20);
  DECLARE v_is_app  TINYINT;

  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1) = 'api_user', 1, 0);
  SET v_source = IF(v_is_app, 'APPLICATION', 'DATABASE');
  SET v_action = IF(v_is_app, COALESCE(@app_action, 'UPDATE'), 'UPDATE');

  INSERT INTO `audit_logs`
    (user_id, username, source, transaction_id, table_name, record_id, action,
     old_data, new_data, ip_address, user_agent, is_succesfull, created_at)
  VALUES (
    IF(v_is_app, @app_user_id, NULL),
    IF(v_is_app, COALESCE(@app_username, USER()), USER()),
    v_source,
    IF(v_is_app, @app_transaction_id, NULL),
    'roles', NEW.id, v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,
      'created_at',OLD.created_at,'created_by',OLD.created_by,
      'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,
      'created_at',NEW.created_at,'created_by',NEW.created_by,
      'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app, @app_ip, NULL),
    IF(v_is_app, @app_user_agent, NULL),
    1, NOW()
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_roles_after_delete$$
CREATE TRIGGER trg_audit_roles_after_delete
AFTER DELETE ON `roles` FOR EACH ROW
BEGIN
  DECLARE v_source  VARCHAR(20);
  DECLARE v_is_app  TINYINT;

  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1) = 'api_user', 1, 0);
  SET v_source = IF(v_is_app, 'APPLICATION', 'DATABASE');

  INSERT INTO `audit_logs`
    (user_id, username, source, transaction_id, table_name, record_id, action,
     old_data, new_data, ip_address, user_agent, is_succesfull, created_at)
  VALUES (
    IF(v_is_app, @app_user_id, NULL),
    IF(v_is_app, COALESCE(@app_username, USER()), USER()),
    v_source,
    IF(v_is_app, @app_transaction_id, NULL),
    'roles', OLD.id, 'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,
      'created_at',OLD.created_at,'created_by',OLD.created_by,
      'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,
    IF(v_is_app, @app_ip, NULL),
    IF(v_is_app, @app_user_agent, NULL),
    1, NOW()
  );
END$$


-- ============================================================
--  users  (password enmascarado como '[PROTECTED]')
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_users_after_insert$$
CREATE TRIGGER trg_audit_users_after_insert
AFTER INSERT ON `users` FOR EACH ROW
BEGIN
  DECLARE v_source  VARCHAR(20);
  DECLARE v_action  VARCHAR(20);
  DECLARE v_is_app  TINYINT;

  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1) = 'api_user', 1, 0);
  SET v_source = IF(v_is_app, 'APPLICATION', 'DATABASE');
  SET v_action = IF(v_is_app, COALESCE(@app_action, 'INSERT'), 'CREATE');

  INSERT INTO `audit_logs`
    (user_id, username, source, transaction_id, table_name, record_id, action,
     old_data, new_data, ip_address, user_agent, is_succesfull, created_at)
  VALUES (
    IF(v_is_app, @app_user_id, NULL),
    IF(v_is_app, COALESCE(@app_username, USER()), USER()),
    v_source,
    IF(v_is_app, @app_transaction_id, NULL),
    'users', NEW.id, v_action,
    JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'surname',NEW.surname,
      'last_name',NEW.last_name,'email',NEW.email,'password','[PROTECTED]',
      'status',NEW.status,'role_id',NEW.role_id,'last_login',NEW.last_login,
      'created_at',NEW.created_at,'created_by',NEW.created_by,
      'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app, @app_ip, NULL),
    IF(v_is_app, @app_user_agent, NULL),
    1, NOW()
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_users_after_update$$
CREATE TRIGGER trg_audit_users_after_update
AFTER UPDATE ON `users` FOR EACH ROW
BEGIN
  DECLARE v_source  VARCHAR(20);
  DECLARE v_action  VARCHAR(20);
  DECLARE v_is_app  TINYINT;

  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1) = 'api_user', 1, 0);
  SET v_source = IF(v_is_app, 'APPLICATION', 'DATABASE');
  SET v_action = IF(v_is_app, COALESCE(@app_action, 'UPDATE'), 'UPDATE');

  INSERT INTO `audit_logs`
    (user_id, username, source, transaction_id, table_name, record_id, action,
     old_data, new_data, ip_address, user_agent, is_succesfull, created_at)
  VALUES (
    IF(v_is_app, @app_user_id, NULL),
    IF(v_is_app, COALESCE(@app_username, USER()), USER()),
    v_source,
    IF(v_is_app, @app_transaction_id, NULL),
    'users', NEW.id, v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'surname',OLD.surname,
      'last_name',OLD.last_name,'email',OLD.email,'password','[PROTECTED]',
      'status',OLD.status,'role_id',OLD.role_id,'last_login',OLD.last_login,
      'created_at',OLD.created_at,'created_by',OLD.created_by,
      'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'surname',NEW.surname,
      'last_name',NEW.last_name,'email',NEW.email,'password','[PROTECTED]',
      'status',NEW.status,'role_id',NEW.role_id,'last_login',NEW.last_login,
      'created_at',NEW.created_at,'created_by',NEW.created_by,
      'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app, @app_ip, NULL),
    IF(v_is_app, @app_user_agent, NULL),
    1, NOW()
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_users_after_delete$$
CREATE TRIGGER trg_audit_users_after_delete
AFTER DELETE ON `users` FOR EACH ROW
BEGIN
  DECLARE v_source  VARCHAR(20);
  DECLARE v_is_app  TINYINT;

  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1) = 'api_user', 1, 0);
  SET v_source = IF(v_is_app, 'APPLICATION', 'DATABASE');

  INSERT INTO `audit_logs`
    (user_id, username, source, transaction_id, table_name, record_id, action,
     old_data, new_data, ip_address, user_agent, is_succesfull, created_at)
  VALUES (
    IF(v_is_app, @app_user_id, NULL),
    IF(v_is_app, COALESCE(@app_username, USER()), USER()),
    v_source,
    IF(v_is_app, @app_transaction_id, NULL),
    'users', OLD.id, 'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'surname',OLD.surname,
      'last_name',OLD.last_name,'email',OLD.email,'password','[PROTECTED]',
      'status',OLD.status,'role_id',OLD.role_id,'last_login',OLD.last_login,
      'created_at',OLD.created_at,'created_by',OLD.created_by,
      'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,
    IF(v_is_app, @app_ip, NULL),
    IF(v_is_app, @app_user_agent, NULL),
    1, NOW()
  );
END$$


-- ============================================================
--  images
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_images_after_insert$$
CREATE TRIGGER trg_audit_images_after_insert
AFTER INSERT ON `images` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'images',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'image_name',NEW.image_name,'mime_type',NEW.mime_type,'extension',NEW.extension,
      'sha256',NEW.sha256,'file_size',NEW.file_size,'image_path',NEW.image_path,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_images_after_update$$
CREATE TRIGGER trg_audit_images_after_update
AFTER UPDATE ON `images` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'images',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'image_name',OLD.image_name,'mime_type',OLD.mime_type,'extension',OLD.extension,
      'sha256',OLD.sha256,'file_size',OLD.file_size,'image_path',OLD.image_path,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'image_name',NEW.image_name,'mime_type',NEW.mime_type,'extension',NEW.extension,
      'sha256',NEW.sha256,'file_size',NEW.file_size,'image_path',NEW.image_path,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_images_after_delete$$
CREATE TRIGGER trg_audit_images_after_delete
AFTER DELETE ON `images` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'images',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'image_name',OLD.image_name,'mime_type',OLD.mime_type,'extension',OLD.extension,
      'sha256',OLD.sha256,'file_size',OLD.file_size,'image_path',OLD.image_path,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  period_types
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_period_types_after_insert$$
CREATE TRIGGER trg_audit_period_types_after_insert
AFTER INSERT ON `period_types` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'period_types',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'code',NEW.code,'months_duration',NEW.months_duration,'status',NEW.status,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_period_types_after_update$$
CREATE TRIGGER trg_audit_period_types_after_update
AFTER UPDATE ON `period_types` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'period_types',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'code',OLD.code,'months_duration',OLD.months_duration,'status',OLD.status,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'code',NEW.code,'months_duration',NEW.months_duration,'status',NEW.status,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_period_types_after_delete$$
CREATE TRIGGER trg_audit_period_types_after_delete
AFTER DELETE ON `period_types` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'period_types',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'code',OLD.code,'months_duration',OLD.months_duration,'status',OLD.status,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  universities
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_universities_after_insert$$
CREATE TRIGGER trg_audit_universities_after_insert
AFTER INSERT ON `universities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'universities',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'short_name',NEW.short_name,'institution_code',NEW.institution_code,
      'image_id',NEW.image_id,'user_id',NEW.user_id,'start_time',NEW.start_time,'end_time',NEW.end_time,
      'period_type_id',NEW.period_type_id,'uses_period_groups',NEW.uses_period_groups,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_universities_after_update$$
CREATE TRIGGER trg_audit_universities_after_update
AFTER UPDATE ON `universities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'universities',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'short_name',OLD.short_name,'institution_code',OLD.institution_code,
      'image_id',OLD.image_id,'user_id',OLD.user_id,'start_time',OLD.start_time,'end_time',OLD.end_time,
      'period_type_id',OLD.period_type_id,'uses_period_groups',OLD.uses_period_groups,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'short_name',NEW.short_name,'institution_code',NEW.institution_code,
      'image_id',NEW.image_id,'user_id',NEW.user_id,'start_time',NEW.start_time,'end_time',NEW.end_time,
      'period_type_id',NEW.period_type_id,'uses_period_groups',NEW.uses_period_groups,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_universities_after_delete$$
CREATE TRIGGER trg_audit_universities_after_delete
AFTER DELETE ON `universities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'universities',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'short_name',OLD.short_name,'institution_code',OLD.institution_code,
      'image_id',OLD.image_id,'user_id',OLD.user_id,'start_time',OLD.start_time,'end_time',OLD.end_time,
      'period_type_id',OLD.period_type_id,'uses_period_groups',OLD.uses_period_groups,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  colors
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_colors_after_insert$$
CREATE TRIGGER trg_audit_colors_after_insert
AFTER INSERT ON `colors` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'colors',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'hex',NEW.hex,'contrast_hex',NEW.contrast_hex,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_colors_after_update$$
CREATE TRIGGER trg_audit_colors_after_update
AFTER UPDATE ON `colors` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'colors',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'hex',OLD.hex,'contrast_hex',OLD.contrast_hex,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'hex',NEW.hex,'contrast_hex',NEW.contrast_hex,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_colors_after_delete$$
CREATE TRIGGER trg_audit_colors_after_delete
AFTER DELETE ON `colors` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'colors',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'hex',OLD.hex,'contrast_hex',OLD.contrast_hex,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  subjects
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_subjects_after_insert$$
CREATE TRIGGER trg_audit_subjects_after_insert
AFTER INSERT ON `subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'subjects',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'short_name',NEW.short_name,'code',NEW.code,'description',NEW.description,
      'hours_per_week',NEW.hours_per_week,'color_id',NEW.color_id,'university_id',NEW.university_id,
      'is_mandatory',NEW.is_mandatory,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_subjects_after_update$$
CREATE TRIGGER trg_audit_subjects_after_update
AFTER UPDATE ON `subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'subjects',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'short_name',OLD.short_name,'code',OLD.code,'description',OLD.description,
      'hours_per_week',OLD.hours_per_week,'color_id',OLD.color_id,'university_id',OLD.university_id,
      'is_mandatory',OLD.is_mandatory,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'short_name',NEW.short_name,'code',NEW.code,'description',NEW.description,
      'hours_per_week',NEW.hours_per_week,'color_id',NEW.color_id,'university_id',NEW.university_id,
      'is_mandatory',NEW.is_mandatory,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_subjects_after_delete$$
CREATE TRIGGER trg_audit_subjects_after_delete
AFTER DELETE ON `subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'subjects',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'short_name',OLD.short_name,'code',OLD.code,'description',OLD.description,
      'hours_per_week',OLD.hours_per_week,'color_id',OLD.color_id,'university_id',OLD.university_id,
      'is_mandatory',OLD.is_mandatory,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  academic_periods
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_academic_periods_after_insert$$
CREATE TRIGGER trg_audit_academic_periods_after_insert
AFTER INSERT ON `academic_periods` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'academic_periods',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'university_id',NEW.university_id,'start_month',NEW.start_month,
      'end_month',NEW.end_month,'year',NEW.year,'order',NEW.`order`,'is_active',NEW.is_active,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_academic_periods_after_update$$
CREATE TRIGGER trg_audit_academic_periods_after_update
AFTER UPDATE ON `academic_periods` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'academic_periods',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'university_id',OLD.university_id,'start_month',OLD.start_month,
      'end_month',OLD.end_month,'year',OLD.year,'order',OLD.`order`,'is_active',OLD.is_active,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'university_id',NEW.university_id,'start_month',NEW.start_month,
      'end_month',NEW.end_month,'year',NEW.year,'order',NEW.`order`,'is_active',NEW.is_active,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_academic_periods_after_delete$$
CREATE TRIGGER trg_audit_academic_periods_after_delete
AFTER DELETE ON `academic_periods` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'academic_periods',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'university_id',OLD.university_id,'start_month',OLD.start_month,
      'end_month',OLD.end_month,'year',OLD.year,'order',OLD.`order`,'is_active',OLD.is_active,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  modalities  (configurations es columna JSON → se serializa como texto)
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_modalities_after_insert$$
CREATE TRIGGER trg_audit_modalities_after_insert
AFTER INSERT ON `modalities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'modalities',NEW.id,v_action,JSON_OBJECT(),
    JSON_SET(JSON_OBJECT('id',NEW.id,'name',NEW.name,'require_classroom',NEW.require_classroom,'status',NEW.status,
      'university_id',NEW.university_id,'created_at',NEW.created_at,'created_by',NEW.created_by,
      'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
      '$.configurations', NEW.configurations),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_modalities_after_update$$
CREATE TRIGGER trg_audit_modalities_after_update
AFTER UPDATE ON `modalities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'modalities',NEW.id,v_action,
    JSON_SET(JSON_OBJECT('id',OLD.id,'name',OLD.name,'require_classroom',OLD.require_classroom,'status',OLD.status,
      'university_id',OLD.university_id,'created_at',OLD.created_at,'created_by',OLD.created_by,
      'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
      '$.configurations', OLD.configurations),
    JSON_SET(JSON_OBJECT('id',NEW.id,'name',NEW.name,'require_classroom',NEW.require_classroom,'status',NEW.status,
      'university_id',NEW.university_id,'created_at',NEW.created_at,'created_by',NEW.created_by,
      'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
      '$.configurations', NEW.configurations),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_modalities_after_delete$$
CREATE TRIGGER trg_audit_modalities_after_delete
AFTER DELETE ON `modalities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'modalities',OLD.id,'DELETE',
    JSON_SET(JSON_OBJECT('id',OLD.id,'name',OLD.name,'require_classroom',OLD.require_classroom,'status',OLD.status,
      'university_id',OLD.university_id,'created_at',OLD.created_at,'created_by',OLD.created_by,
      'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
      '$.configurations', OLD.configurations),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  careers
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_careers_after_insert$$
CREATE TRIGGER trg_audit_careers_after_insert
AFTER INSERT ON `careers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'careers',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'university_id',NEW.university_id,'short_name',NEW.short_name,
      'code',NEW.code,'modality_id',NEW.modality_id,'total_periods',NEW.total_periods,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_careers_after_update$$
CREATE TRIGGER trg_audit_careers_after_update
AFTER UPDATE ON `careers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'careers',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'university_id',OLD.university_id,'short_name',OLD.short_name,
      'code',OLD.code,'modality_id',OLD.modality_id,'total_periods',OLD.total_periods,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'university_id',NEW.university_id,'short_name',NEW.short_name,
      'code',NEW.code,'modality_id',NEW.modality_id,'total_periods',NEW.total_periods,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_careers_after_delete$$
CREATE TRIGGER trg_audit_careers_after_delete
AFTER DELETE ON `careers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'careers',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'university_id',OLD.university_id,'short_name',OLD.short_name,
      'code',OLD.code,'modality_id',OLD.modality_id,'total_periods',OLD.total_periods,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  career_period_exceptions
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_career_period_exceptions_after_insert$$
CREATE TRIGGER trg_audit_career_period_exceptions_after_insert
AFTER INSERT ON `career_period_exceptions` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'career_period_exceptions',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'career_id',NEW.career_id,'period_number',NEW.period_number,'reason',NEW.reason,
      'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_career_period_exceptions_after_update$$
CREATE TRIGGER trg_audit_career_period_exceptions_after_update
AFTER UPDATE ON `career_period_exceptions` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'career_period_exceptions',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'career_id',OLD.career_id,'period_number',OLD.period_number,'reason',OLD.reason,
      'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'career_id',NEW.career_id,'period_number',NEW.period_number,'reason',NEW.reason,
      'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_career_period_exceptions_after_delete$$
CREATE TRIGGER trg_audit_career_period_exceptions_after_delete
AFTER DELETE ON `career_period_exceptions` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'career_period_exceptions',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'career_id',OLD.career_id,'period_number',OLD.period_number,'reason',OLD.reason,
      'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  career_subjects
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_career_subjects_after_insert$$
CREATE TRIGGER trg_audit_career_subjects_after_insert
AFTER INSERT ON `career_subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'career_subjects',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'subjects_id',NEW.subjects_id,'careers_id',NEW.careers_id,'period_number',NEW.period_number,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_career_subjects_after_update$$
CREATE TRIGGER trg_audit_career_subjects_after_update
AFTER UPDATE ON `career_subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'career_subjects',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'subjects_id',OLD.subjects_id,'careers_id',OLD.careers_id,'period_number',OLD.period_number,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'subjects_id',NEW.subjects_id,'careers_id',NEW.careers_id,'period_number',NEW.period_number,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_career_subjects_after_delete$$
CREATE TRIGGER trg_audit_career_subjects_after_delete
AFTER DELETE ON `career_subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'career_subjects',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'subjects_id',OLD.subjects_id,'careers_id',OLD.careers_id,'period_number',OLD.period_number,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  shifts
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_shifts_after_insert$$
CREATE TRIGGER trg_audit_shifts_after_insert
AFTER INSERT ON `shifts` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'shifts',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'university_id',NEW.university_id,'order',NEW.`order`,
      'start_time',NEW.start_time,'end_time',NEW.end_time,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_shifts_after_update$$
CREATE TRIGGER trg_audit_shifts_after_update
AFTER UPDATE ON `shifts` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'shifts',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'university_id',OLD.university_id,'order',OLD.`order`,
      'start_time',OLD.start_time,'end_time',OLD.end_time,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'university_id',NEW.university_id,'order',NEW.`order`,
      'start_time',NEW.start_time,'end_time',NEW.end_time,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_shifts_after_delete$$
CREATE TRIGGER trg_audit_shifts_after_delete
AFTER DELETE ON `shifts` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'shifts',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'university_id',OLD.university_id,'order',OLD.`order`,
      'start_time',OLD.start_time,'end_time',OLD.end_time,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  groups
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_groups_after_insert$$
CREATE TRIGGER trg_audit_groups_after_insert
AFTER INSERT ON `groups` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'groups',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'career_id',NEW.career_id,'period_number',NEW.period_number,
      'letter',NEW.letter,'shift_id',NEW.shift_id,'academic_period_id',NEW.academic_period_id,
      'university_id',NEW.university_id,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_groups_after_update$$
CREATE TRIGGER trg_audit_groups_after_update
AFTER UPDATE ON `groups` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'groups',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'career_id',OLD.career_id,'period_number',OLD.period_number,
      'letter',OLD.letter,'shift_id',OLD.shift_id,'academic_period_id',OLD.academic_period_id,
      'university_id',OLD.university_id,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'career_id',NEW.career_id,'period_number',NEW.period_number,
      'letter',NEW.letter,'shift_id',NEW.shift_id,'academic_period_id',NEW.academic_period_id,
      'university_id',NEW.university_id,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_groups_after_delete$$
CREATE TRIGGER trg_audit_groups_after_delete
AFTER DELETE ON `groups` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'groups',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'career_id',OLD.career_id,'period_number',OLD.period_number,
      'letter',OLD.letter,'shift_id',OLD.shift_id,'academic_period_id',OLD.academic_period_id,
      'university_id',OLD.university_id,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  teachers
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_teachers_after_insert$$
CREATE TRIGGER trg_audit_teachers_after_insert
AFTER INSERT ON `teachers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'surname',NEW.surname,'last_name',NEW.last_name,
      'require_classroom',NEW.require_classroom,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teachers_after_update$$
CREATE TRIGGER trg_audit_teachers_after_update
AFTER UPDATE ON `teachers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'surname',OLD.surname,'last_name',OLD.last_name,
      'require_classroom',OLD.require_classroom,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'surname',NEW.surname,'last_name',NEW.last_name,
      'require_classroom',NEW.require_classroom,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teachers_after_delete$$
CREATE TRIGGER trg_audit_teachers_after_delete
AFTER DELETE ON `teachers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'surname',OLD.surname,'last_name',OLD.last_name,
      'require_classroom',OLD.require_classroom,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  teacher_availabilities
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_teacher_availabilities_after_insert$$
CREATE TRIGGER trg_audit_teacher_availabilities_after_insert
AFTER INSERT ON `teacher_availabilities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teacher_availabilities',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'teacher_id',NEW.teacher_id,'day_of_week',NEW.day_of_week,
      'start_time',NEW.start_time,'end_time',NEW.end_time,'is_available',NEW.is_available,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teacher_availabilities_after_update$$
CREATE TRIGGER trg_audit_teacher_availabilities_after_update
AFTER UPDATE ON `teacher_availabilities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teacher_availabilities',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'teacher_id',OLD.teacher_id,'day_of_week',OLD.day_of_week,
      'start_time',OLD.start_time,'end_time',OLD.end_time,'is_available',OLD.is_available,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'teacher_id',NEW.teacher_id,'day_of_week',NEW.day_of_week,
      'start_time',NEW.start_time,'end_time',NEW.end_time,'is_available',NEW.is_available,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teacher_availabilities_after_delete$$
CREATE TRIGGER trg_audit_teacher_availabilities_after_delete
AFTER DELETE ON `teacher_availabilities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teacher_availabilities',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'teacher_id',OLD.teacher_id,'day_of_week',OLD.day_of_week,
      'start_time',OLD.start_time,'end_time',OLD.end_time,'is_available',OLD.is_available,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  teachers_subjects
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_teachers_subjects_after_insert$$
CREATE TRIGGER trg_audit_teachers_subjects_after_insert
AFTER INSERT ON `teachers_subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers_subjects',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'teachers_id',NEW.teachers_id,'subjects_id',NEW.subjects_id,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teachers_subjects_after_update$$
CREATE TRIGGER trg_audit_teachers_subjects_after_update
AFTER UPDATE ON `teachers_subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers_subjects',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'teachers_id',OLD.teachers_id,'subjects_id',OLD.subjects_id,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'teachers_id',NEW.teachers_id,'subjects_id',NEW.subjects_id,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teachers_subjects_after_delete$$
CREATE TRIGGER trg_audit_teachers_subjects_after_delete
AFTER DELETE ON `teachers_subjects` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers_subjects',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'teachers_id',OLD.teachers_id,'subjects_id',OLD.subjects_id,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  teachers_universities
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_teachers_universities_after_insert$$
CREATE TRIGGER trg_audit_teachers_universities_after_insert
AFTER INSERT ON `teachers_universities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers_universities',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'teachers_id',NEW.teachers_id,'universities_id',NEW.universities_id,
      'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teachers_universities_after_update$$
CREATE TRIGGER trg_audit_teachers_universities_after_update
AFTER UPDATE ON `teachers_universities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers_universities',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'teachers_id',OLD.teachers_id,'universities_id',OLD.universities_id,
      'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'teachers_id',NEW.teachers_id,'universities_id',NEW.universities_id,
      'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_teachers_universities_after_delete$$
CREATE TRIGGER trg_audit_teachers_universities_after_delete
AFTER DELETE ON `teachers_universities` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'teachers_universities',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'teachers_id',OLD.teachers_id,'universities_id',OLD.universities_id,
      'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  classroom_types
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_classroom_types_after_insert$$
CREATE TRIGGER trg_audit_classroom_types_after_insert
AFTER INSERT ON `classroom_types` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classroom_types',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'description',NEW.description,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_classroom_types_after_update$$
CREATE TRIGGER trg_audit_classroom_types_after_update
AFTER UPDATE ON `classroom_types` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classroom_types',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'description',OLD.description,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'description',NEW.description,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_classroom_types_after_delete$$
CREATE TRIGGER trg_audit_classroom_types_after_delete
AFTER DELETE ON `classroom_types` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classroom_types',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'description',OLD.description,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  classrooms
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_classrooms_after_insert$$
CREATE TRIGGER trg_audit_classrooms_after_insert
AFTER INSERT ON `classrooms` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classrooms',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'classroom_type_id',NEW.classroom_type_id,'code',NEW.code,
      'floor',NEW.floor,'building',NEW.building,'building_code',NEW.building_code,
      'universities_id',NEW.universities_id,'is_restricted',NEW.is_restricted,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_classrooms_after_update$$
CREATE TRIGGER trg_audit_classrooms_after_update
AFTER UPDATE ON `classrooms` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classrooms',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'classroom_type_id',OLD.classroom_type_id,'code',OLD.code,
      'floor',OLD.floor,'building',OLD.building,'building_code',OLD.building_code,
      'universities_id',OLD.universities_id,'is_restricted',OLD.is_restricted,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'name',NEW.name,'classroom_type_id',NEW.classroom_type_id,'code',NEW.code,
      'floor',NEW.floor,'building',NEW.building,'building_code',NEW.building_code,
      'universities_id',NEW.universities_id,'is_restricted',NEW.is_restricted,'status',NEW.status,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_classrooms_after_delete$$
CREATE TRIGGER trg_audit_classrooms_after_delete
AFTER DELETE ON `classrooms` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classrooms',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'name',OLD.name,'classroom_type_id',OLD.classroom_type_id,'code',OLD.code,
      'floor',OLD.floor,'building',OLD.building,'building_code',OLD.building_code,
      'universities_id',OLD.universities_id,'is_restricted',OLD.is_restricted,'status',OLD.status,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  classroom_careers
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_classroom_careers_after_insert$$
CREATE TRIGGER trg_audit_classroom_careers_after_insert
AFTER INSERT ON `classroom_careers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classroom_careers',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'careers_id',NEW.careers_id,'classrooms_id',NEW.classrooms_id,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_classroom_careers_after_update$$
CREATE TRIGGER trg_audit_classroom_careers_after_update
AFTER UPDATE ON `classroom_careers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classroom_careers',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'careers_id',OLD.careers_id,'classrooms_id',OLD.classrooms_id,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'careers_id',NEW.careers_id,'classrooms_id',NEW.classrooms_id,'is_deleted',NEW.is_deleted,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_classroom_careers_after_delete$$
CREATE TRIGGER trg_audit_classroom_careers_after_delete
AFTER DELETE ON `classroom_careers` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'classroom_careers',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'careers_id',OLD.careers_id,'classrooms_id',OLD.classrooms_id,'is_deleted',OLD.is_deleted,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$


-- ============================================================
--  user_configurations
-- ============================================================

DROP TRIGGER IF EXISTS trg_audit_user_configurations_after_insert$$
CREATE TRIGGER trg_audit_user_configurations_after_insert
AFTER INSERT ON `user_configurations` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'INSERT'),'CREATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'user_configurations',NEW.id,v_action,JSON_OBJECT(),
    JSON_OBJECT('id',NEW.id,'user_id',NEW.user_id,'selected_university_id',NEW.selected_university_id,
      'theme',NEW.theme,'accent',NEW.accent,'status',NEW.status,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_user_configurations_after_update$$
CREATE TRIGGER trg_audit_user_configurations_after_update
AFTER UPDATE ON `user_configurations` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_action VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  SET v_action = IF(v_is_app,COALESCE(@app_action,'UPDATE'),'UPDATE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'user_configurations',NEW.id,v_action,
    JSON_OBJECT('id',OLD.id,'user_id',OLD.user_id,'selected_university_id',OLD.selected_university_id,
      'theme',OLD.theme,'accent',OLD.accent,'status',OLD.status,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    JSON_OBJECT('id',NEW.id,'user_id',NEW.user_id,'selected_university_id',NEW.selected_university_id,
      'theme',NEW.theme,'accent',NEW.accent,'status',NEW.status,
      'created_at',NEW.created_at,'created_by',NEW.created_by,'updated_at',NEW.updated_at,'updated_by',NEW.updated_by),
    IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DROP TRIGGER IF EXISTS trg_audit_user_configurations_after_delete$$
CREATE TRIGGER trg_audit_user_configurations_after_delete
AFTER DELETE ON `user_configurations` FOR EACH ROW
BEGIN
  DECLARE v_source VARCHAR(20); DECLARE v_is_app TINYINT;
  SET v_is_app = IF(SUBSTRING_INDEX(USER(),'@',1)='api_user',1,0);
  SET v_source = IF(v_is_app,'APPLICATION','DATABASE');
  INSERT INTO `audit_logs`(user_id,username,source,transaction_id,table_name,record_id,action,old_data,new_data,ip_address,user_agent,is_succesfull,created_at)
  VALUES(IF(v_is_app,@app_user_id,NULL),IF(v_is_app,COALESCE(@app_username,USER()),USER()),v_source,IF(v_is_app,@app_transaction_id,NULL),
    'user_configurations',OLD.id,'DELETE',
    JSON_OBJECT('id',OLD.id,'user_id',OLD.user_id,'selected_university_id',OLD.selected_university_id,
      'theme',OLD.theme,'accent',OLD.accent,'status',OLD.status,
      'created_at',OLD.created_at,'created_by',OLD.created_by,'updated_at',OLD.updated_at,'updated_by',OLD.updated_by),
    NULL,IF(v_is_app,@app_ip,NULL),IF(v_is_app,@app_user_agent,NULL),1,NOW());
END$$

DELIMITER ;




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

DELIMITER ;