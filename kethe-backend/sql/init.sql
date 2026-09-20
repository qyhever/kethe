SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `category_icons`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `email_verification_codes`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier',
  `username` varchar(50) NOT NULL,
  `nickname` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Hashed password',
  `deletedAt` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `isEnabled` tinyint NOT NULL DEFAULT '1' COMMENT '启用/禁用',
  `isSystemDefault` tinyint NOT NULL DEFAULT '0' COMMENT '系统默认',
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_username` (`username`),
  UNIQUE KEY `uk_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `email_verification_codes` (
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier',
  `deletedAt` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  `email` varchar(255) NOT NULL,
  `purpose` varchar(32) NOT NULL,
  `codeHash` char(64) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `sentAt` timestamp NOT NULL,
  `consumedAt` timestamp NULL DEFAULT NULL,
  `failedAttempts` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email_verification_code_email_purpose` (`email`,`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `projects` (
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int NULL DEFAULT NULL COMMENT '创建人用户ID',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int NULL DEFAULT NULL COMMENT '更新人用户ID',
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier',
  `description` varchar(500) NULL DEFAULT NULL COMMENT '项目描述',
  `deletedAt` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  `effectiveTimeStart` timestamp NULL DEFAULT NULL COMMENT '生效开始时间',
  `effectiveTimeEnd` timestamp NULL DEFAULT NULL COMMENT '生效结束时间',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '项目名称',
  `type` char(1) NOT NULL COMMENT '项目类型：1 社招，2 校招',
  `isEnabled` tinyint NOT NULL DEFAULT '1' COMMENT '启用/禁用',
  `isSystemDefault` tinyint NOT NULL DEFAULT '0' COMMENT '系统默认',
  PRIMARY KEY (`id`),
  KEY `idx_project_type` (`type`),
  KEY `idx_project_deleted_at` (`deletedAt`),
  KEY `idx_project_effective_time` (`effectiveTimeStart`,`effectiveTimeEnd`),
  CONSTRAINT `chk_project_type` CHECK (`type` IN ('1', '2'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
-- 记账 H5 v1 核心表结构
-- Database: MySQL 8.0+
--
-- 约定：
-- 1. 金额统一使用最小货币单位存储，例如人民币：分
-- 2. categories / accounts 均为用户级数据
-- 3. 系统默认数据在用户初始化时复制给用户
-- 4. 分类、账户均采用停用 + 软删除
-- 5. transactions 当前支持：支出 / 收入 / 转账
-- ============================================================

-- ============================================================
-- 1. 分类图标表
-- ============================================================
CREATE TABLE category_icons (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '图标ID',
    iconKey        VARCHAR(64) NOT NULL COMMENT '图标唯一标识，例如 food、transport、shopping',
    iconName       VARCHAR(64) NOT NULL COMMENT '图标名称，例如 餐饮、交通',
    groupKey       VARCHAR(32) NOT NULL DEFAULT 'other' COMMENT '图标分组标识',
    svgContent     MEDIUMTEXT NOT NULL COMMENT 'SVG完整内容',
    color           VARCHAR(7) NOT NULL DEFAULT '#64748B' COMMENT '图标主题色，格式为#RRGGBB',
    isSystemDefault TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否系统内置：0否，1是',
    isEnabled       TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否启用：0停用，1启用',
    createdAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updatedAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                    ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_category_icons_key (iconKey),
    KEY idx_category_icons_is_enabled (isEnabled)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  COMMENT='分类图标资源表';

INSERT INTO category_icons (iconKey, iconName, svgContent, color) VALUES
('food', '餐饮', '<svg viewBox="0 0 24 24"><path d="M7 3v8m3-8v8M5 7h7m-3 4v10M17 3v18m0-18c3 2 3 7 0 9" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#FF7A1A'),
('transport', '交通', '<svg viewBox="0 0 24 24"><path d="M5 16V7c0-3 14-3 14 0v9M5 13h14M8 18h.01M16 18h.01" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('shopping', '购物', '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8zm4 0a3 3 0 016 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8657E8'),
('housing', '住房', '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10h-6v-7H9v7H3V11z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#25BF70'),
('entertainment', '娱乐', '<svg viewBox="0 0 24 24"><path d="M7 8h10l3 10-3 2-3-4h-4l-3 4-3-2L7 8zm3 4H7m1.5-1.5v3M16 12h.01M18 14h.01" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F45272'),
('medical', '医疗', '<svg viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F05468'),
('education', '教育', '<svg viewBox="0 0 24 24"><path d="M2 8l10-5 10 5-10 5L2 8zm4 3v6c4 3 8 3 12 0v-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F2A30B'),
('gift', '人情', '<svg viewBox="0 0 24 24"><path d="M3 10h18v11H3V10zm-1-4h20v4H2V6zm10 0v15M12 6C8 6 7 2 9 2c2 0 3 4 3 4zm0 0c4 0 5-4 3-4-2 0-3 4-3 4z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F34F72'),
('communication', '通讯', '<svg viewBox="0 0 24 24"><path d="M6 2h12v20H6V2zm4 17h4" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#3B7EF2'),
('subscription', '订阅', '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4V5zm6 4l5 3-5 3V9z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8D50EA'),
('finance', '金融', '<svg viewBox="0 0 24 24"><path d="M3 9l9-6 9 6M5 10v8m5-8v8m4-8v8m5-8v8M3 21h18" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#42CDB2'),
('salary', '工资', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M4.5 8H18"/><path d="M14.5 11.5h5.5v4h-5.5a2 2 0 0 1 0-4Z"/><circle cx="16" cy="13.5" r=".75" fill="currentColor" stroke="none"/></svg>', '#347DF0'),
('bonus', '奖金', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l-1.5 5h-5L8 3Z"/><circle cx="12" cy="13" r="5"/><path d="m12 10.2.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3.9-1.8Z"/></svg>', '#F2A30B'),
('part-time', '兼职', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="12" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 11.5c2.8 1.4 5.8 2.1 9 2.1s6.2-.7 9-2.1"/><path d="M10.5 13.5h3"/></svg>', '#6755E8'),
('investment', '理财', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18V6"/><path d="M4 18h16"/><path d="m7 14 4-4 3 3 5-6"/><path d="M15.5 7H19v3.5"/></svg>', '#42CDB2'),
('gift-money', '礼金', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M12 9v11"/><path d="M3 13h18"/><path d="M12 9H8.5A2.5 2.5 0 1 1 11 6.5L12 9Z"/><path d="M12 9h3.5A2.5 2.5 0 1 0 13 6.5L12 9Z"/></svg>', '#F34F72'),
('other', '其他', '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>', '#64748B');

UPDATE category_icons SET groupKey = 'food' WHERE iconKey IN ('food');
UPDATE category_icons SET groupKey = 'transport' WHERE iconKey IN ('transport');
UPDATE category_icons SET groupKey = 'shopping' WHERE iconKey IN ('shopping');
UPDATE category_icons SET groupKey = 'housing' WHERE iconKey IN ('housing');
UPDATE category_icons SET groupKey = 'entertainment' WHERE iconKey IN ('entertainment', 'subscription');
UPDATE category_icons SET groupKey = 'medical' WHERE iconKey IN ('medical');
UPDATE category_icons SET groupKey = 'education' WHERE iconKey IN ('education');
UPDATE category_icons SET groupKey = 'social' WHERE iconKey IN ('gift', 'gift-money', 'communication');
UPDATE category_icons SET groupKey = 'income' WHERE iconKey IN ('salary', 'bonus', 'part-time', 'investment');
UPDATE category_icons SET groupKey = 'finance' WHERE iconKey IN ('finance');

INSERT INTO category_icons (iconKey, iconName, groupKey, svgContent, color) VALUES
('breakfast', '早餐', 'food', '<svg viewBox="0 0 24 24"><path d="M4 10h16a8 8 0 0 1-16 0Zm3 9h10M6 7h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', '#FF6B35'),
('dessert', '甜点', 'food', '<svg viewBox="0 0 24 24"><path d="M5 10h14l-2 10H7L5 10Zm2-1c1-4 9-4 10 0M9 5c0-2 2-3 3-1" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F45272'),
('fruit', '水果', 'food', '<svg viewBox="0 0 24 24"><path d="M12 7c-7-4-10 8-4 13 2 2 3 0 4 0s2 2 4 0c6-5 3-17-4-13Zm0 0c0-3 2-5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#35B85A'),
('snack', '零食', 'food', '<svg viewBox="0 0 24 24"><path d="M8 4h8l3 5-7 11L5 9l3-5Zm0 0 4 5 4-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#FF864A'),
('pizza', '外卖', 'food', '<svg viewBox="0 0 24 24"><path d="M4 20 12 3l8 17H4Zm4-5h.01M14 11h.01M15 17h.01" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#FF6334'),
('bus', '公交', 'transport', '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 13h14M8 7h8M8 21v-1m8 1v-1" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('train', '地铁', 'transport', '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 12h12M9 22l3-3 3 3" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8657E8'),
('taxi', '打车', 'transport', '<svg viewBox="0 0 24 24"><path d="m5 11 2-5h10l2 5v8H5v-8Zm3-5 1-2h6l1 2M5 14h14" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#25BF70'),
('flight', '机票', 'transport', '<svg viewBox="0 0 24 24"><path d="m2 16 20-8-1-3-8 2-5-4-2 1 3 5-5 2-2-2-1 1 1 6Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('fuel', '加油', 'transport', '<svg viewBox="0 0 24 24"><path d="M5 21V3h10v18M4 21h12M8 7h4m6 3 2 2v6a2 2 0 0 1-4 0v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F44336'),
('cart', '日用', 'shopping', '<svg viewBox="0 0 24 24"><path d="M3 4h2l2 12h11l2-8H6m3 12h.01M17 20h.01" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F45272'),
('clothes', '服饰', 'shopping', '<svg viewBox="0 0 24 24"><path d="m8 4-5 4 3 4 2-2v11h8V10l2 2 3-4-5-4c-1 3-7 3-8 0Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8657E8'),
('phone', '数码', 'shopping', '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 18h4" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('furniture', '家具', 'housing', '<svg viewBox="0 0 24 24"><path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M3 11v7h18v-7M6 18v3m12-3v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#9A674F'),
('movie', '电影', 'entertainment', '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 3 3 3m2-3 3 3m-2 5v5l4-2.5-4-2.5Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8657E8'),
('music', '音乐', 'entertainment', '<svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3m10 1a3 3 0 1 1-3-3h3" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F45272'),
('travel', '旅行', 'entertainment', '<svg viewBox="0 0 24 24"><path d="M3 18c5-2 8-6 10-15 5 4 7 9 8 15H3Zm6-1c1-3 4-5 8-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#35B85A'),
('pet', '宠物', 'entertainment', '<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="20" cy="13" r="2"/><path d="M7 18c0-5 10-5 10 0 0 4-3 3-5 2-2 1-5 2-5-2Z" fill="currentColor"/></svg>', '#9A674F'),
('fitness', '健身', 'medical', '<svg viewBox="0 0 24 24"><path d="M3 9v6m3-8v10m12-10v10m3-8v6M6 12h12" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('medicine', '药品', 'medical', '<svg viewBox="0 0 24 24"><path d="M7 4a4 4 0 0 1 6 0l7 7a4 4 0 0 1-6 6L7 10a4 4 0 0 1 0-6Zm2 9 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F44336'),
('books', '书籍', 'education', '<svg viewBox="0 0 24 24"><path d="M4 4h7v16H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm16 0h-7v16h7a2 2 0 0 1 2 2V6a2 2 0 0 0-2-2Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F2A30B'),
('handshake', '礼尚往来', 'social', '<svg viewBox="0 0 24 24"><path d="m3 8 5-3 4 2 4-2 5 3-3 8-5 4-3-2-2 1-5-5V8Zm5-3 4 7 3-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0');

-- ============================================================
-- 2. 分类表
-- ============================================================
CREATE TABLE categories (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    userId             INT NOT NULL COMMENT '所属用户ID',
    categoryType       TINYINT UNSIGNED NOT NULL COMMENT '分类类型：1支出，2收入',
    parentId           BIGINT UNSIGNED DEFAULT NULL COMMENT '父分类ID；NULL表示一级分类',
    name                VARCHAR(12) NOT NULL COMMENT '分类名称',
    remark              VARCHAR(50) DEFAULT NULL COMMENT '分类备注',
    iconId             BIGINT UNSIGNED DEFAULT NULL COMMENT '图标ID，关联category_icons.id',
    systemKey          VARCHAR(64) DEFAULT NULL COMMENT '系统默认分类标识，例如 expense_food；自定义分类为空',
    isSystemDefault   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否由系统默认分类初始化：0否，1是',
    sortOrder          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
    isEnabled           TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否启用：0停用，1启用',
    deletedAt          DATETIME(3) DEFAULT NULL COMMENT '软删除时间；NULL表示未删除',
    createdAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updatedAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                        ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_user_system_key (userId, systemKey),
    KEY idx_categories_user_type_is_enabled
        (userId, categoryType, isEnabled, deletedAt),
    KEY idx_categories_parent
        (parentId),
    KEY idx_categories_user_parent_sort
        (userId, parentId, sortOrder),
    KEY idx_categories_icon
        (iconId),
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parentId)
        REFERENCES categories(id),
    CONSTRAINT fk_categories_icon
        FOREIGN KEY (iconId)
        REFERENCES category_icons(id),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (userId)
        REFERENCES users(id),
    CONSTRAINT chk_categories_type
        CHECK (categoryType IN (1, 2)),
    CONSTRAINT chk_categories_is_enabled
        CHECK (isEnabled IN (0, 1)),
    CONSTRAINT chk_categories_system_default
        CHECK (isSystemDefault IN (0, 1))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  COMMENT='用户收支分类表';

-- ============================================================
-- 3. 账户表
-- ============================================================
CREATE TABLE accounts (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账户ID',
    userId             INT NOT NULL COMMENT '所属用户ID',
    name                VARCHAR(50) NOT NULL COMMENT '账户名称，例如现金、微信、支付宝',
    accountType        TINYINT UNSIGNED NOT NULL COMMENT
                        '一级类型：1现金，10信用账户，20储蓄账户，30虚拟账户，99其他',
    accountSubType     SMALLINT UNSIGNED DEFAULT NULL COMMENT
                        '二级类型：201信用卡，202消费信贷，301借记卡，302存折，401在线支付，402现金券，403储值卡',
    accountNature      TINYINT UNSIGNED NOT NULL COMMENT
                        '账户性质：1资产，2负债',
    institutionName    VARCHAR(100) DEFAULT NULL COMMENT '银行或服务商名称',
    accountNumberLast4 CHAR(4) DEFAULT NULL COMMENT '账号后四位；不保存完整卡号',
    creditLimit        BIGINT UNSIGNED DEFAULT NULL COMMENT '信用额度，最小货币单位',
    iconKey             VARCHAR(64) DEFAULT NULL COMMENT
                        '账户图标标识，例如cash、bank-card、wechat',
    systemKey          VARCHAR(64) DEFAULT NULL COMMENT
                        '系统默认账户标识，例如 cash、wechat、alipay；自定义账户为空',
    isSystemDefault   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT
                        '是否由系统默认账户初始化：0否，1是',
    currency            CHAR(3) NOT NULL DEFAULT 'CNY' COMMENT
                        'ISO 4217币种代码，例如CNY、USD',
    initialBalance     BIGINT NOT NULL DEFAULT 0 COMMENT
                        '初始余额，最小货币单位，例如人民币分',
    currentBalance     BIGINT NOT NULL DEFAULT 0 COMMENT
                        '当前余额，最小货币单位，例如人民币分',
    includeInNetWorth  TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT
                        '是否计入净资产：0否，1是',
    sortOrder          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT
                        '排序值，越小越靠前',
    isEnabled           TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT
                        '是否启用：0停用，1启用',
    remark              VARCHAR(255) DEFAULT NULL COMMENT '账户备注',
    deletedAt          DATETIME(3) DEFAULT NULL COMMENT
                        '软删除时间；NULL表示未删除',
    createdAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT
                        '创建时间',
    updatedAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                        ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_accounts_user_system_key
        (userId, systemKey),
    KEY idx_accounts_user_is_enabled
        (userId, isEnabled, deletedAt),
    KEY idx_accounts_user_sort
        (userId, sortOrder),
    KEY idx_accounts_user_type
        (userId, accountType, accountSubType),
    CONSTRAINT chk_accounts_type
        CHECK (accountType IN (1, 10, 20, 30, 99)),
    CONSTRAINT chk_accounts_nature
        CHECK (accountNature IN (1, 2)),
    CONSTRAINT chk_accounts_credit_limit
        CHECK (creditLimit IS NULL OR creditLimit >= 0),
    CONSTRAINT fk_accounts_user
        FOREIGN KEY (userId)
        REFERENCES users(id),
    CONSTRAINT chk_accounts_is_enabled
        CHECK (isEnabled IN (0, 1)),
    CONSTRAINT chk_accounts_include_net_worth
        CHECK (includeInNetWorth IN (0, 1)),
    CONSTRAINT chk_accounts_system_default
        CHECK (isSystemDefault IN (0, 1))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  COMMENT='用户资金账户表';

-- ============================================================
-- 4. 流水表
-- ============================================================
CREATE TABLE transactions (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
    userId             INT NOT NULL COMMENT '所属用户ID',
    transactionType    TINYINT UNSIGNED NOT NULL COMMENT
                        '流水类型：1支出，2收入，3转账',
    amount              BIGINT UNSIGNED NOT NULL COMMENT
                        '交易金额，始终为正整数，使用最小货币单位，例如人民币分',
    categoryId         BIGINT UNSIGNED DEFAULT NULL COMMENT
                        '收支分类ID；支出/收入必填，转账为空',
    accountId          BIGINT UNSIGNED NOT NULL COMMENT
                        '主账户ID；支出=付款账户，收入=收款账户，转账=转出账户',
    targetAccountId   BIGINT UNSIGNED DEFAULT NULL COMMENT
                        '目标账户ID；仅转账使用，表示转入账户',
    currency            CHAR(3) NOT NULL DEFAULT 'CNY' COMMENT
                        '交易币种，ISO 4217代码',
    remark              VARCHAR(500) DEFAULT NULL COMMENT '备注',
    transactionTime    DATETIME(3) NOT NULL COMMENT
                        '记账时间/业务发生时间',
    deletedAt          DATETIME(3) DEFAULT NULL COMMENT
                        '软删除时间；NULL表示正常流水',
    createdAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT
                        '创建时间',
    updatedAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                        ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_transactions_user_time
        (userId, transactionTime DESC, id DESC),
    KEY idx_transactions_user_type_time
        (userId, transactionType, transactionTime DESC),
    KEY idx_transactions_user_category_time
        (userId, categoryId, transactionTime DESC),
    KEY idx_transactions_user_account_time
        (userId, accountId, transactionTime DESC),
    KEY idx_transactions_target_account_time
        (targetAccountId, transactionTime DESC),
    KEY idx_transactions_user_deleted_time
        (userId, deletedAt, transactionTime DESC),
    CONSTRAINT fk_transactions_category
        FOREIGN KEY (categoryId)
        REFERENCES categories(id),
    CONSTRAINT fk_transactions_account
        FOREIGN KEY (accountId)
        REFERENCES accounts(id),
    CONSTRAINT fk_transactions_target_account
        FOREIGN KEY (targetAccountId)
        REFERENCES accounts(id),
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (userId)
        REFERENCES users(id),
    CONSTRAINT chk_transactions_type
        CHECK (transactionType IN (1, 2, 3)),
    CONSTRAINT chk_transactions_amount
        CHECK (amount > 0),
    CONSTRAINT chk_transactions_account_relation
        CHECK (
            targetAccountId IS NULL
            OR targetAccountId <> accountId
        ),
    CONSTRAINT chk_transactions_fields
        CHECK (
            (
                transactionType IN (1, 2)
                AND categoryId IS NOT NULL
                AND targetAccountId IS NULL
            )
            OR
            (
                transactionType = 3
                AND categoryId IS NULL
                AND targetAccountId IS NOT NULL
            )
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  COMMENT='用户记账流水表';
