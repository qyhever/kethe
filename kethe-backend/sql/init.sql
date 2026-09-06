DROP TABLE IF EXISTS `email_verification_codes`;
DROP TABLE IF EXISTS `users`;
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
    svgContent     MEDIUMTEXT NOT NULL COMMENT 'SVG完整内容',
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

-- ============================================================
-- 2. 分类表
-- ============================================================
CREATE TABLE categories (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    userId             BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
    categoryType       TINYINT UNSIGNED NOT NULL COMMENT '分类类型：1支出，2收入',
    parentId           BIGINT UNSIGNED DEFAULT NULL COMMENT '父分类ID；NULL表示一级分类',
    name                VARCHAR(50) NOT NULL COMMENT '分类名称',
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
    userId             BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
    name                VARCHAR(50) NOT NULL COMMENT '账户名称，例如现金、微信、支付宝',
    accountType        TINYINT UNSIGNED NOT NULL COMMENT
                        '账户类型：1现金，2银行卡，3支付宝，4微信，5PayPal，99其他',
    icon                VARCHAR(255) DEFAULT NULL COMMENT
                        '账户图标标识或图标资源地址；账户图标暂不与分类图标耦合',
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
    includeInAssets   TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT
                        '是否计入总资产：0否，1是',
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
    CONSTRAINT chk_accounts_is_enabled
        CHECK (isEnabled IN (0, 1)),
    CONSTRAINT chk_accounts_include_assets
        CHECK (includeInAssets IN (0, 1)),
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
    userId             BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
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
