SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `expense_projects`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `category_icons`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `email_verification_codes`;
DROP TABLE IF EXISTS `feedbacks`;
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

CREATE TABLE feedbacks (
  id INT NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
  userId INT NOT NULL,
  content VARCHAR(1000) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_feedbacks_user_created (userId, createdAt),
  CONSTRAINT fk_feedbacks_user FOREIGN KEY (userId) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
('private-car', '私家车', 'transport', '<svg viewBox="0 0 24 24"><path d="m4 12 2-5h12l2 5v7H4v-7Zm0 2h16M7 19v2m10-2v2M7 16h.01M17 16h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', '#347DF0'),
('charging', '充电', 'transport', '<svg viewBox="0 0 24 24"><path d="M5 21V3h10v18M4 21h12M8 7h4m6 3 2 2v6a2 2 0 0 1-4 0v-5M11 9l-2 4h3l-2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', '#35B85A'),
('parking', '停车', 'transport', '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('toll', '过路费', 'transport', '<svg viewBox="0 0 24 24"><path d="M3 7h18M6 7v14m12-14v14M8 12h8m-4-5V3M9 21l3-5 3 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', '#F2A30B'),
('car-rental', '租车', 'transport', '<svg viewBox="0 0 24 24"><path d="m3 13 2-5h14l2 5v6H3v-6Zm0 2h18M6 19v2m12-2v2M7 17h.01M17 17h.01M9 5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', '#8657E8'),
('cruise', '游轮', 'transport', '<svg viewBox="0 0 24 24"><path d="M3 14h18l-3 6H6l-3-6Zm4 0V8h10v6M10 8V4h4v4M2 22c2-1 4-1 6 0s4 1 6 0 4-1 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', '#347DF0'),
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

INSERT INTO category_icons (iconKey, iconName, groupKey, svgContent, color) VALUES
('present', '礼物', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h14v11H5V10Zm-2-4h18v4H3V6Zm9 0v15M12 6c-8 0-7-6-3-4l3 4Zm0 0c8 0 7-6 3-4l-3 4Z"/></svg>', '#F45272'),
('lunch', '午餐', 'food', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 0 16 0H4Zm3 8h10M8 8V5m4 3V3m4 5V5"/></svg>', '#FF7A1A'),
('dinner', '晚餐', 'food', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h18M5 14a7 7 0 0 1 14 0M12 7V5m-2 0h4M4 18h16M7 21h10"/></svg>', '#FF7A1A'),
('drinks', '酒水饮料', 'food', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10l-1 17H8L7 4Zm0 5h10m-5 0 3-7h3"/></svg>', '#FF7A1A'),
('railway', '火车', 'transport', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v13H5V4Zm0 8h14M9 4v8m6-8v8M8 17l-3 5m11-5 3 5M7 20h10M8 15h.01M16 15h.01"/></svg>', '#347DF0'),
('beauty', '美妆', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11h6v10H9V11Zm1 0V5l4-2v8M8 21h8"/></svg>', '#F45272'),
('appliances', '家电', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5V3Zm0 5h14M8 6h.01M16 6h.01"/></svg>', '#F45272'),
('shopping-other', '其他购物', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2M9 14h.01M12 14h.01M15 14h.01"/></svg>', '#F45272'),
('rent', '房租', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/></svg>', '#9A674F'),
('mortgage', '房贷', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-6 9 6M5 8v13h14V8m-7 4v7m2-6h-3a1 1 0 0 0 0 3h2a1 1 0 0 1 0 3h-3"/></svg>', '#9A674F'),
('utilities', '水电', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3c-2 3-5 6-5 9a5 5 0 0 0 10 0c0-3-3-6-5-9Zm10 0-4 8h4l-2 10 6-12h-4l2-6"/></svg>', '#9A674F'),
('gas', '燃气', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 5 7 7 7 12a7 7 0 0 1-14 0c0-3 2-5 4-7 0 3 1 4 2 4 2-2 2-5 1-9Zm0 12c-2 2-3 3-3 4a3 3 0 0 0 6 0c0-1-1-2-3-4Z"/></svg>', '#9A674F'),
('property', '物业', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4h10v17M14 9h6v12M2 21h20M7 8h4m-4 4h4m-4 4h4m6-3h.01M17 17h.01"/></svg>', '#9A674F'),
('game', '游戏', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10a4 4 0 0 1 4 4l1 7a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-7a4 4 0 0 1 4-4Zm-2 5h6m-3-3v6m8-3h.01M18 14h.01"/></svg>', '#8657E8'),
('party', '聚会', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 21 4-12 7 7-11 5ZM8 9l7 7M13 3v3m5-1-2 3m5 2h-3M7 4l2 2m10 11 2 2"/></svg>', '#8657E8'),
('outpatient', '门诊', 'medical', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v15H4V6Zm4 0V3h8v3m-4 5v6m-3-3h6"/></svg>', '#F44336'),
('hospital', '住院', 'medical', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V3h14v18M2 21h20M10 21v-5h4v5m-2-14v6m-3-3h6"/></svg>', '#F44336'),
('healthcare', '保健', 'medical', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21S3 15 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13ZM4 12h4l2-4 3 8 2-4h5"/></svg>', '#F44336'),
('tuition', '学费', 'education', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 8 10-5 10 5-10 5-10-5Zm4 2v7c4 3 8 3 12 0v-7m4-2v9"/></svg>', '#F2A30B'),
('training', '培训', 'education', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v12H3V3Zm9 12v6m-4 0 4-3 4 3M7 8h10m-10 3h6"/></svg>', '#F2A30B'),
('exams', '考试', 'education', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H5v17h14V4h-3M8 2h8v4H8V2Zm0 9 2 2 4-4m-6 8h8"/></svg>', '#F2A30B'),
('red-packet', '红包', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5V3Zm0 4 7 5 7-5m-7 5v6m-3-3h6"/></svg>', '#F45272'),
('treat', '请客', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18m11 0V3c-4 3-4 9 0 10"/></svg>', '#F45272'),
('internet', '网费', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a15 15 0 0 1 18 0M6 11a10 10 0 0 1 12 0m-9 4a5 5 0 0 1 6 0m-3 4h.01"/></svg>', '#347DF0'),
('delivery', '快递', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7 5l9 4"/></svg>', '#347DF0'),
('media', '影音', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v14H3V4Zm7 4 5 3-5 3V8Zm-3 14h10m-5-4v4"/></svg>', '#8657E8'),
('membership', '会员', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18v14H3V6Zm4 4 3 2 2-3 2 3 3-2-1 6H8l-1-6Z"/></svg>', '#8657E8'),
('software', '软件', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v16H3V4Zm0 4h18m-12 4-3 2 3 2m6-4 3 2-3 2"/></svg>', '#8657E8'),
('cloud', '云服务', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a5 5 0 0 1-1-10 6 6 0 0 1 12-1 5 5 0 0 1 0 11H7Zm5-7v10m-3-7 3-3 3 3"/></svg>', '#8657E8'),
('fee', '手续费', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm3 5h8m-8 4h8m-8 4h4"/></svg>', '#35B85A'),
('interest', '利息', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17 5 3 6-8 5 5M16 12h4v4M4 4v16h16"/></svg>', '#35B85A'),
('insurance', '保险', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6"/></svg>', '#35B85A'),
('tax', '税费', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21h16M6 21V10m4 11V10m4 11V10m4 11V10M3 8l9-5 9 5H3Z"/></svg>', '#35B85A'),
('charity', '公益', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12s-5-3-5-6a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 3-5 6-5 6ZM2 16h4l4-2h5a2 2 0 0 1 0 4h-5m5 0 5-3 2 2-7 5H8l-6-3"/></svg>', '#64748B'),
('repair', '维修', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3a6 6 0 0 0-7 7L3 18a2 2 0 0 0 3 3l8-8a6 6 0 0 0 7-7l-4 4-3-3 4-4h-4Z"/></svg>', '#64748B'),
('loss', '丢失', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v14H4V7Zm3 0V3h10v4m-8 5 6 5m0-5-6 5"/></svg>', '#64748B'),
('miscellaneous', '其他支出', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm13 0v6m-3-3h6"/></svg>', '#64748B')
ON DUPLICATE KEY UPDATE iconName = VALUES(iconName), groupKey = VALUES(groupKey), svgContent = VALUES(svgContent), color = VALUES(color);

-- 景点门票、纪念品和住宿分类图标，沿用 24px 圆角线框风格。
INSERT INTO category_icons (iconKey, iconName, groupKey, svgContent, color) VALUES
('attraction-ticket', '景点门票', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Z"/><path d="M15 5v2m0 4v2m0 4v2M7 10l2-2 3 4H7"/></svg>', '#8657E8'),
('souvenir', '纪念品', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="3"/><path d="m10 8 3 3m-1 1 4-4 6 6-7 7-6-6 3-3Z"/><path d="m16 12 .8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3.8-1.6Z"/></svg>', '#F45272'),
('accommodation', '住宿', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v14m18-7v7M3 17h18v-5a2 2 0 0 0-2-2h-8v7"/><path d="M3 17V9h5a3 3 0 0 1 3 3"/><path d="M3 20h18"/><circle cx="7" cy="13" r="1"/></svg>', '#25BF70'),
('hotel', '酒店', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M3 21h18M10 21v-5h4v5M9 7h1m4 0h1m-6 4h1m4 0h1"/></svg>', '#25BF70'),
('homestay', '民宿', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-6h6v6M16 6V3h3v5"/><rect x="10" y="9" width="4" height="3" rx=".5"/></svg>', '#25BF70'),
('accommodation-other', '其它住宿', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5V3ZM8 6h8v6H8V6Z"/><circle cx="9" cy="9" r=".5" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r=".5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r=".5" fill="currentColor" stroke="none"/><path d="M15 16h1"/></svg>', '#25BF70')
ON DUPLICATE KEY UPDATE iconName = VALUES(iconName), groupKey = VALUES(groupKey), svgContent = VALUES(svgContent), color = VALUES(color);

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
CREATE TABLE members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(12) NOT NULL,
  iconKey VARCHAR(64) NOT NULL,
  systemKey VARCHAR(64) NULL,
  isSystemDefault TINYINT(1) NOT NULL DEFAULT 0,
  sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
  deletedAt DATETIME(3) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_members_user_system (userId, systemKey),
  CONSTRAINT fk_members_user FOREIGN KEY (userId) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE expense_projects (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 userId INT NOT NULL,
 name VARCHAR(30) NOT NULL,
 iconKey VARCHAR(64) NOT NULL DEFAULT 'folder',
 startDate DATE NULL,
 endDate DATE NULL,
 remark VARCHAR(500) NULL,
 isArchived TINYINT(1) NOT NULL DEFAULT 0,
 deletedAt DATETIME(3) NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 KEY idx_expense_projects_user_status (userId, isArchived, deletedAt),
 CONSTRAINT fk_expense_projects_user FOREIGN KEY (userId) REFERENCES users(id),
 CONSTRAINT chk_expense_projects_dates CHECK (startDate IS NULL OR endDate IS NULL OR endDate >= startDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE transactions (
 expenseProjectId BIGINT UNSIGNED NULL,
 KEY idx_transactions_user_project_deleted_time (userId, expenseProjectId, deletedAt, transactionTime, id),
 CONSTRAINT fk_transactions_expense_project FOREIGN KEY (expenseProjectId) REFERENCES expense_projects(id),
 CONSTRAINT chk_transactions_expense_project CHECK (expenseProjectId IS NULL OR transactionType = 1),
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
    userId             INT NOT NULL COMMENT '所属用户ID',
    transactionType    TINYINT UNSIGNED NOT NULL COMMENT
                        '流水类型：1支出，2收入，3转账',
    amount              BIGINT UNSIGNED NOT NULL COMMENT
                        '交易金额，始终为正整数，使用最小货币单位，例如人民币分',
    categoryId         BIGINT UNSIGNED DEFAULT NULL COMMENT
                        '收支分类ID；支出/收入必填，转账为空',
    memberId BIGINT UNSIGNED NULL,
    accountId          BIGINT UNSIGNED NOT NULL COMMENT
                        '主账户ID；支出=付款账户，收入=收款账户，转账=转出账户',
    targetAccountId   BIGINT UNSIGNED DEFAULT NULL COMMENT
                        '目标账户ID；仅转账使用，表示转入账户',
    currency            CHAR(3) NOT NULL DEFAULT 'CNY' COMMENT
                        '交易币种，ISO 4217代码',
    remark              VARCHAR(500) DEFAULT NULL COMMENT '备注',
    transactionTime    DATETIME(3) NOT NULL COMMENT
                        '记账时间/业务发生时间',
    timePrecision      TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT
                        '时间精度：1仅日期，2日期和时刻',
    deletedAt          DATETIME(3) DEFAULT NULL COMMENT
                        '软删除时间；NULL表示正常流水',
    createdAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT
                        '创建时间',
    updatedAt          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                        ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    CONSTRAINT chk_transactions_time_precision
        CHECK (timePrecision IN (1, 2)),
    KEY idx_transactions_user_member_time (userId, memberId, transactionTime DESC),
    CONSTRAINT fk_transactions_member FOREIGN KEY (memberId) REFERENCES members(id),
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

UPDATE categories AS child
JOIN categories AS parent ON parent.id = child.parentId AND parent.userId = child.userId
JOIN (
  SELECT 'expense_food_breakfast' AS systemKey, 'breakfast' AS iconKey
  UNION ALL SELECT 'expense_food_lunch', 'lunch'
  UNION ALL SELECT 'expense_food_dinner', 'dinner'
  UNION ALL SELECT 'expense_food_fruit', 'fruit'
  UNION ALL SELECT 'expense_food_snacks', 'snack'
  UNION ALL SELECT 'expense_food_drinks', 'drinks'
  UNION ALL SELECT 'expense_transport_bus', 'bus'
  UNION ALL SELECT 'expense_transport_subway', 'train'
  UNION ALL SELECT 'expense_transport_taxi', 'taxi'
  UNION ALL SELECT 'expense_transport_train', 'railway'
  UNION ALL SELECT 'expense_transport_flight', 'flight'
  UNION ALL SELECT 'expense_transport_private_car', 'private-car'
  UNION ALL SELECT 'expense_transport_fuel', 'fuel'
  UNION ALL SELECT 'expense_transport_charging', 'charging'
  UNION ALL SELECT 'expense_transport_parking', 'parking'
  UNION ALL SELECT 'expense_transport_toll', 'toll'
  UNION ALL SELECT 'expense_transport_car_rental', 'car-rental'
  UNION ALL SELECT 'expense_transport_cruise', 'cruise'
  UNION ALL SELECT 'expense_shopping_daily', 'cart'
  UNION ALL SELECT 'expense_shopping_clothing', 'clothes'
  UNION ALL SELECT 'expense_shopping_digital', 'phone'
  UNION ALL SELECT 'expense_shopping_beauty', 'beauty'
  UNION ALL SELECT 'expense_shopping_appliances', 'appliances'
  UNION ALL SELECT 'expense_shopping_other', 'shopping-other'
  UNION ALL SELECT 'expense_shopping_souvenir', 'souvenir'
  UNION ALL SELECT 'expense_housing_rent', 'rent'
  UNION ALL SELECT 'expense_housing_mortgage', 'mortgage'
  UNION ALL SELECT 'expense_housing_utilities', 'utilities'
  UNION ALL SELECT 'expense_housing_gas', 'gas'
  UNION ALL SELECT 'expense_housing_property', 'property'
  UNION ALL SELECT 'expense_entertainment_movie', 'movie'
  UNION ALL SELECT 'expense_entertainment_games', 'game'
  UNION ALL SELECT 'expense_entertainment_travel', 'travel'
  UNION ALL SELECT 'expense_entertainment_party', 'party'
  UNION ALL SELECT 'expense_entertainment_sports', 'fitness'
  UNION ALL SELECT 'expense_entertainment_attraction_tickets', 'attraction-ticket'
  UNION ALL SELECT 'expense_accommodation_hotel', 'hotel'
  UNION ALL SELECT 'expense_accommodation_homestay', 'homestay'
  UNION ALL SELECT 'expense_accommodation_other', 'accommodation-other'
  UNION ALL SELECT 'expense_medical_medicine', 'medicine'
  UNION ALL SELECT 'expense_medical_outpatient', 'outpatient'
  UNION ALL SELECT 'expense_medical_hospital', 'hospital'
  UNION ALL SELECT 'expense_medical_healthcare', 'healthcare'
  UNION ALL SELECT 'expense_education_tuition', 'tuition'
  UNION ALL SELECT 'expense_education_books', 'books'
  UNION ALL SELECT 'expense_education_training', 'training'
  UNION ALL SELECT 'expense_education_exams', 'exams'
  UNION ALL SELECT 'expense_gift_cash', 'gift-money'
  UNION ALL SELECT 'expense_gift_present', 'present'
  UNION ALL SELECT 'expense_gift_red_packet', 'red-packet'
  UNION ALL SELECT 'expense_gift_treat', 'treat'
  UNION ALL SELECT 'expense_communication_phone', 'phone'
  UNION ALL SELECT 'expense_communication_internet', 'internet'
  UNION ALL SELECT 'expense_communication_delivery', 'delivery'
  UNION ALL SELECT 'expense_subscription_media', 'media'
  UNION ALL SELECT 'expense_subscription_membership', 'membership'
  UNION ALL SELECT 'expense_subscription_software', 'software'
  UNION ALL SELECT 'expense_subscription_cloud', 'cloud'
  UNION ALL SELECT 'expense_finance_fee', 'fee'
  UNION ALL SELECT 'expense_finance_interest', 'interest'
  UNION ALL SELECT 'expense_finance_insurance', 'insurance'
  UNION ALL SELECT 'expense_finance_tax', 'tax'
  UNION ALL SELECT 'expense_other_pet', 'pet'
  UNION ALL SELECT 'expense_other_charity', 'charity'
  UNION ALL SELECT 'expense_other_repair', 'repair'
  UNION ALL SELECT 'expense_other_loss', 'loss'
  UNION ALL SELECT 'expense_other_miscellaneous', 'miscellaneous'
) AS defaults ON defaults.systemKey = child.systemKey
JOIN category_icons AS icon ON icon.iconKey = defaults.iconKey AND icon.isEnabled = 1
SET child.iconId = icon.id
WHERE child.isSystemDefault = 1 AND (child.iconId IS NULL OR child.iconId = parent.iconId);
