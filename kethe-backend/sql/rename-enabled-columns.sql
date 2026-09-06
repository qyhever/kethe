-- MySQL 8.0+
-- 将已有记账相关表的 status 字段重命名为 isEnabled，
-- 并将 category_icons.isSystem 重命名为 isSystemDefault。

ALTER TABLE category_icons
    DROP INDEX idx_category_icons_status,
    CHANGE COLUMN isSystem isSystemDefault
        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否系统内置：0否，1是',
    CHANGE COLUMN status isEnabled
        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否启用：0停用，1启用',
    ADD INDEX idx_category_icons_is_enabled (isEnabled);

ALTER TABLE categories
    DROP INDEX idx_categories_user_type_status,
    DROP CHECK chk_categories_status,
    CHANGE COLUMN status isEnabled
        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否启用：0停用，1启用',
    ADD INDEX idx_categories_user_type_is_enabled
        (userId, categoryType, isEnabled, deletedAt),
    ADD CONSTRAINT chk_categories_is_enabled
        CHECK (isEnabled IN (0, 1));

ALTER TABLE accounts
    DROP INDEX idx_accounts_user_status,
    DROP CHECK chk_accounts_status,
    CHANGE COLUMN status isEnabled
        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否启用：0停用，1启用',
    ADD INDEX idx_accounts_user_is_enabled
        (userId, isEnabled, deletedAt),
    ADD CONSTRAINT chk_accounts_is_enabled
        CHECK (isEnabled IN (0, 1));
