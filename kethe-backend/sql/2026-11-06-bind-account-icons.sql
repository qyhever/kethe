-- 可选：将指定用户的 23 个同名账户绑定到专属图标。
-- 先执行 2026-11-06-account-specific-icons.sql。
-- 将下面的 NULL 替换为目标 accounts.userId；保持 NULL 时不会更新任何账户。
-- 名称按字节精确匹配，不包含页面追加的“ · 尾号 xxxx”。
-- 跨表的名称与 iconKey 均按二进制比较，避免不同表的排序规则冲突。
-- 仅匹配当前设计稿中的账户性质和合法适用类型，跳过软删除账户和停用图标。
-- 仅更新 iconKey，保留金额、类型、默认规则及其他业务字段。
-- 重复执行时已绑定正确图标的账户不会再次更新。
SET NAMES utf8mb4;
SET @account_icon_user_id = 15;

DROP TEMPORARY TABLE IF EXISTS tmp_account_icon_bindings;
CREATE TEMPORARY TABLE tmp_account_icon_bindings (
  accountName VARCHAR(50) NOT NULL PRIMARY KEY,
  iconKey VARCHAR(64) NOT NULL,
  accountNature TINYINT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
INSERT INTO tmp_account_icon_bindings (accountName, iconKey, accountNature) VALUES
  ('中国银行长城电子借记卡', 'boc-great-wall-debit', 1),
  ('抖音月付', 'douyin-monthly', 1),
  ('美团月付', 'meituan-monthly', 1),
  ('京东白条', 'jd-baitiao', 1),
  ('工银亚洲湾区通借记卡', 'icbc-asia-bay-debit', 1),
  ('数字人民币', 'digital-rmb', 1),
  ('农业银行借记卡', 'abc-debit', 1),
  ('现金', 'cash', 1),
  ('银行卡', 'personal-bank-card', 1),
  ('PayPal', 'paypal', 1),
  ('微信', 'wechat', 1),
  ('支付宝', 'alipay', 1),
  ('工商银行星座卡银联', 'icbc-zodiac-unionpay', 2),
  ('工商银行星座卡 VISA', 'icbc-zodiac-visa', 2),
  ('工商银行 ETC', 'icbc-etc', 2),
  ('农业银行无界信用卡', 'abc-unbounded-credit', 2),
  ('建设银行信用卡', 'ccb-credit', 2),
  ('汇丰香港蓝狮子万事达卡', 'hsbc-hk-blue-lion', 2),
  ('中信银行信用卡', 'citic-credit', 2),
  ('平安银行信用卡', 'pingan-credit', 2),
  ('ZABank VISA绿卡', 'za-visa-green', 2),
  ('蚂蚁花呗', 'huabei', 2),
  ('招商银行信用卡', 'cmb-credit', 2);

START TRANSACTION;

-- 预览本次会更换的账户（执行整个脚本将随后提交）。
SELECT a.id, a.name, a.iconKey AS oldIconKey, m.iconKey AS newIconKey
FROM accounts a
JOIN tmp_account_icon_bindings m
  ON CAST(a.name AS BINARY) = CAST(m.accountName AS BINARY) AND a.accountNature = m.accountNature
JOIN icon_scene_options o ON o.scene = 'account' AND CAST(o.iconKey AS BINARY) = CAST(m.iconKey AS BINARY) AND o.isEnabled = 1
JOIN icon_resources r ON r.id = o.resourceId AND r.isEnabled = 1
WHERE a.userId = @account_icon_user_id AND a.deletedAt IS NULL
  AND NOT (CAST(a.iconKey AS BINARY) <=> CAST(m.iconKey AS BINARY))
  AND EXISTS (SELECT 1 FROM account_icon_rules rule WHERE rule.optionId = o.id AND rule.accountType = a.accountType);

UPDATE accounts a
JOIN tmp_account_icon_bindings m
  ON CAST(a.name AS BINARY) = CAST(m.accountName AS BINARY) AND a.accountNature = m.accountNature
JOIN icon_scene_options o ON o.scene = 'account' AND CAST(o.iconKey AS BINARY) = CAST(m.iconKey AS BINARY) AND o.isEnabled = 1
JOIN icon_resources r ON r.id = o.resourceId AND r.isEnabled = 1
SET a.iconKey = m.iconKey
WHERE a.userId = @account_icon_user_id AND a.deletedAt IS NULL
  AND NOT (CAST(a.iconKey AS BINARY) <=> CAST(m.iconKey AS BINARY))
  AND EXISTS (SELECT 1 FROM account_icon_rules rule WHERE rule.optionId = o.id AND rule.accountType = a.accountType);
SELECT ROW_COUNT() AS updatedAccounts;

COMMIT;
DROP TEMPORARY TABLE tmp_account_icon_bindings;
