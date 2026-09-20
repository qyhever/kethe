-- 账户分类重构：旧类型迁移为一级类型、二级子类型和资产性质。
-- 本脚本需与使用新枚举的后端在同一维护窗口发布。

ALTER TABLE accounts
  DROP CHECK chk_accounts_type,
  DROP CHECK chk_accounts_include_assets,
  ADD COLUMN accountSubType SMALLINT UNSIGNED DEFAULT NULL
    COMMENT '二级类型：201信用卡，202消费信贷，301借记卡，302存折，401在线支付，402现金券，403储值卡'
    AFTER accountType,
  ADD COLUMN accountNature TINYINT UNSIGNED NULL
    COMMENT '账户性质：1资产，2负债'
    AFTER accountSubType,
  ADD COLUMN institutionName VARCHAR(100) DEFAULT NULL
    COMMENT '银行或服务商名称'
    AFTER accountNature,
  ADD COLUMN accountNumberLast4 CHAR(4) DEFAULT NULL
    COMMENT '账号后四位；不保存完整卡号'
    AFTER institutionName,
  ADD COLUMN creditLimit BIGINT UNSIGNED DEFAULT NULL
    COMMENT '信用额度，最小货币单位'
    AFTER accountNumberLast4,
  RENAME COLUMN includeInAssets TO includeInNetWorth;

UPDATE accounts
SET
  accountSubType = CASE
    WHEN accountType = 2 THEN 301
    WHEN accountType IN (3, 4, 5) THEN 401
    ELSE NULL
  END,
  accountNature = 1,
  accountType = CASE
    WHEN accountType = 1 THEN 1
    WHEN accountType = 2 THEN 20
    WHEN accountType IN (3, 4, 5) THEN 30
    WHEN accountType = 99 THEN 99
  END;

ALTER TABLE accounts
  MODIFY COLUMN accountNature TINYINT UNSIGNED NOT NULL
    COMMENT '账户性质：1资产，2负债',
  MODIFY COLUMN accountType TINYINT UNSIGNED NOT NULL
    COMMENT '一级类型：1现金，10信用账户，20储蓄账户，30虚拟账户，99其他',
  MODIFY COLUMN includeInNetWorth TINYINT UNSIGNED NOT NULL DEFAULT 1
    COMMENT '是否计入净资产：0否，1是',
  ADD CONSTRAINT chk_accounts_type
    CHECK (accountType IN (1, 10, 20, 30, 99)),
  ADD CONSTRAINT chk_accounts_nature
    CHECK (accountNature IN (1, 2)),
  ADD CONSTRAINT chk_accounts_credit_limit
    CHECK (creditLimit IS NULL OR creditLimit >= 0),
  ADD CONSTRAINT chk_accounts_include_net_worth
    CHECK (includeInNetWorth IN (0, 1)),
  ADD KEY idx_accounts_user_type (userId, accountType, accountSubType);

-- systemKey 和账户名称保持不变；应用层会为新用户使用“储蓄卡”名称。
