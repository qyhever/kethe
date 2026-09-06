-- 记账 H5 v1 增量校准脚本（MySQL 8.0+）
-- 执行前请备份数据库；执行后运行 pnpm backfill:defaults。

SET @schema_name = DATABASE();
SET FOREIGN_KEY_CHECKS = 0;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = @schema_name AND table_name = 'user')
  AND NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = @schema_name AND table_name = 'users'),
  'RENAME TABLE `user` TO `users`', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = @schema_name AND table_name = 'email_verification_code')
  AND NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = @schema_name AND table_name = 'email_verification_codes'),
  'RENAME TABLE `email_verification_code` TO `email_verification_codes`', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = @schema_name AND table_name = 'project')
  AND NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = @schema_name AND table_name = 'projects'),
  'RENAME TABLE `project` TO `projects`', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE categories
  MODIFY userId INT NOT NULL;
ALTER TABLE accounts MODIFY userId INT NOT NULL;
ALTER TABLE transactions MODIFY userId INT NOT NULL;

SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'categories' AND column_name = 'createdAt'),
  'ALTER TABLE categories ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'categories' AND column_name = 'updatedAt'),
  'ALTER TABLE categories ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'categories' AND column_name = 'deletedAt'),
  'ALTER TABLE categories ADD COLUMN deletedAt DATETIME(3) NULL', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'accounts' AND column_name = 'createdAt'),
  'ALTER TABLE accounts ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'accounts' AND column_name = 'updatedAt'),
  'ALTER TABLE accounts ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'accounts' AND column_name = 'deletedAt'),
  'ALTER TABLE accounts ADD COLUMN deletedAt DATETIME(3) NULL', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = @schema_name AND table_name = 'categories' AND constraint_name = 'fk_categories_user'),
  'ALTER TABLE categories ADD CONSTRAINT fk_categories_user FOREIGN KEY (userId) REFERENCES users(id)', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = @schema_name AND table_name = 'accounts' AND constraint_name = 'fk_accounts_user'),
  'ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user FOREIGN KEY (userId) REFERENCES users(id)', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = @schema_name AND table_name = 'transactions' AND constraint_name = 'fk_transactions_user'),
  'ALTER TABLE transactions ADD CONSTRAINT fk_transactions_user FOREIGN KEY (userId) REFERENCES users(id)', 'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO category_icons (iconKey, iconName, svgContent, isSystemDefault, isEnabled)
VALUES
  ('food', '餐饮', '<svg viewBox="0 0 24 24"><path d="M7 3v18M12 3v18M17 3v18"/></svg>', 1, 1),
  ('transport', '交通', '<svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z"/></svg>', 1, 1),
  ('shopping', '购物', '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6z"/></svg>', 1, 1),
  ('housing', '住房', '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10H3z"/></svg>', 1, 1),
  ('entertainment', '娱乐', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>', 1, 1),
  ('medical', '医疗', '<svg viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>', 1, 1),
  ('education', '教育', '<svg viewBox="0 0 24 24"><path d="M2 8l10-5 10 5-10 5z"/></svg>', 1, 1),
  ('gift', '人情', '<svg viewBox="0 0 24 24"><path d="M3 8h18v13H3z"/></svg>', 1, 1),
  ('communication', '通讯', '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20"/></svg>', 1, 1),
  ('subscription', '订阅', '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/></svg>', 1, 1),
  ('finance', '金融', '<svg viewBox="0 0 24 24"><path d="M3 9l9-6 9 6v12H3z"/></svg>', 1, 1),
  ('other', '其他', '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>', 1, 1)
ON DUPLICATE KEY UPDATE iconName = VALUES(iconName), isEnabled = 1;

SET FOREIGN_KEY_CHECKS = 1;
