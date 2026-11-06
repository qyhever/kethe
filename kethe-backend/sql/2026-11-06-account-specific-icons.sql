-- 账户专属图标：19 个新增图标，现金、微信、支付宝、PayPal 复用原目录。
-- 前置：已执行 2026-10-26-unify-business-icons.sql；MySQL 8，目标数据库由调用方选择。
-- 仅补充缺失数据，重复执行不覆盖既有图形、颜色、排序、启停或默认配置。
-- 不更新 accounts；绑定已有账户请另行使用 2026-11-06-bind-account-icons.sql。
-- personal-bank-card 对应 manifest 的 bank-card，避免覆盖原有通用 bank-card 图标。
SET NAMES utf8mb4;
START TRANSACTION;

-- 中国银行长城电子借记卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:boc-great-wall-debit', '中国银行长城电子借记卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v6m0 5v6"/><rect x="8.5" y="9.5" width="7" height="5"/></g></svg>', '#B5283D'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:boc-great-wall-debit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'boc-great-wall-debit', r.id, '中国银行长城电子借记卡', 'card', 100, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:boc-great-wall-debit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'boc-great-wall-debit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 20, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'boc-great-wall-debit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 20 AND accountSubType = 0);

-- 抖音月付
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:douyin-monthly', '抖音月付', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M14 3h3c.3 2.6 1.7 4.1 4 4.5v3c-1.6-.1-3-.7-4-1.5v7a5.5 5.5 0 1 1-5-5.5v3.2a2.4 2.4 0 1 0 2 2.3Z" fill="currentColor"/></svg>', '#242632'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:douyin-monthly');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'douyin-monthly', r.id, '抖音月付', 'wallet', 101, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:douyin-monthly'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'douyin-monthly');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 30, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'douyin-monthly'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 30 AND accountSubType = 0);
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'douyin-monthly'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 美团月付
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:meituan-monthly', '美团月付', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="15" rx="4"/><path d="M8 7V5a4 4 0 0 1 8 0v2m-8 6 4 4 4-4M12 11v6"/></g></svg>', '#C68B09'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:meituan-monthly');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'meituan-monthly', r.id, '美团月付', 'wallet', 102, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:meituan-monthly'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'meituan-monthly');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 30, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'meituan-monthly'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 30 AND accountSubType = 0);
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'meituan-monthly'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 京东白条
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:jd-baitiao', '京东白条', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 7h6M9 11h6m-6 4h3"/></g></svg>', '#E83946'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:jd-baitiao');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'jd-baitiao', r.id, '京东白条', 'wallet', 103, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:jd-baitiao'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'jd-baitiao');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 30, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'jd-baitiao'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 30 AND accountSubType = 0);
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'jd-baitiao'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 工银亚洲湾区通借记卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:icbc-asia-bay-debit', '工银亚洲湾区通借记卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15h18M4 15l3-8 5 5 5-5 3 8M7 7v12m10-12v12M3 19h18"/></g><circle cx="12" cy="5" r="2" fill="currentColor"/></svg>', '#C93442'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:icbc-asia-bay-debit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'icbc-asia-bay-debit', r.id, '工银亚洲湾区通借记卡', 'card', 104, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:icbc-asia-bay-debit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'icbc-asia-bay-debit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 20, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'icbc-asia-bay-debit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 20 AND accountSubType = 0);

-- 数字人民币
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:digital-rmb', '数字人民币', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2.5" width="16" height="19" rx="4"/><path d="m8 7 4 5 4-5m-8 5h8m-8 3h8m-4-3v6"/></g></svg>', '#DF5349'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:digital-rmb');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'digital-rmb', r.id, '数字人民币', 'wallet', 105, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:digital-rmb'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'digital-rmb');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 30, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'digital-rmb'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 30 AND accountSubType = 0);

-- 农业银行借记卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:abc-debit', '农业银行借记卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 18V6m0 5L8 7m4 7L6.5 9m5.5 2 4-4m-4 7 5.5-5M8 18h8"/></g></svg>', '#008B78'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:abc-debit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'abc-debit', r.id, '农业银行借记卡', 'card', 106, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:abc-debit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'abc-debit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 20, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'abc-debit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 20 AND accountSubType = 0);

-- 银行卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:personal-bank-card', '银行卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M3 9h18M6 15h4m5 0h3"/></g></svg>', '#5878B5'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:personal-bank-card');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'personal-bank-card', r.id, '银行卡', 'card', 108, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:personal-bank-card'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'personal-bank-card');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 20, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'personal-bank-card'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 20 AND accountSubType = 0);

-- 工商银行星座卡银联
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:icbc-zodiac-unionpay', '工商银行星座卡银联', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M3 9h18M6 15h4"/></g><g transform="translate(11 10) scale(.43)"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 7h8M8 17h8M10 7v10m4-10v10M3 10h4v4H3m18-4h-4v4h4"/></g></g><path d="m6 7 .7 1.5 1.7.2-1.2 1.1.3 1.7L6 10.7l-1.5.8.3-1.7-1.2-1.1 1.7-.2Z" fill="currentColor"/><path d="m4 17 2-3h2l-2 3Zm3 0 2-3h2l-2 3Z" fill="currentColor" opacity=".45"/></svg>', '#C93442'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:icbc-zodiac-unionpay');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'icbc-zodiac-unionpay', r.id, '工商银行星座卡银联', 'card', 112, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:icbc-zodiac-unionpay'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'icbc-zodiac-unionpay');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'icbc-zodiac-unionpay'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 工商银行星座卡 VISA
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:icbc-zodiac-visa', '工商银行星座卡 VISA', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M3 9h18M6 15h4"/></g><g transform="translate(11 10) scale(.43)"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 7h8M8 17h8M10 7v10m4-10v10M3 10h4v4H3m18-4h-4v4h4"/></g></g><path d="m6 7 .7 1.5 1.7.2-1.2 1.1.3 1.7L6 10.7l-1.5.8.3-1.7-1.2-1.1 1.7-.2Z" fill="currentColor"/><path d="m5 13 1.5 4 2-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>', '#9A497D'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:icbc-zodiac-visa');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'icbc-zodiac-visa', r.id, '工商银行星座卡 VISA', 'card', 113, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:icbc-zodiac-visa'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'icbc-zodiac-visa');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'icbc-zodiac-visa'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 工商银行 ETC
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:icbc-etc', '工商银行 ETC', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3-4 18M16 3l4 18M12 4v3m0 4v3m0 4v3M2.5 10h19"/><path d="M5 6h14"/></g></svg>', '#D76B38'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:icbc-etc');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'icbc-etc', r.id, '工商银行 ETC', 'card', 114, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:icbc-etc'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'icbc-etc');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'icbc-etc'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 农业银行无界信用卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:abc-unbounded-credit', '农业银行无界信用卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M3 9h18M6 15h4"/></g><g transform="translate(11 10) scale(.43)"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 18V6m0 5L8 7m4 7L6.5 9m5.5 2 4-4m-4 7 5.5-5M8 18h8"/></g></g><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7c2-3 4 3 6 0"/></g></svg>', '#008B78'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:abc-unbounded-credit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'abc-unbounded-credit', r.id, '农业银行无界信用卡', 'card', 115, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:abc-unbounded-credit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'abc-unbounded-credit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'abc-unbounded-credit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 建设银行信用卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:ccb-credit', '建设银行信用卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 6a8.5 8.5 0 1 0 0 12l-3-3a4.3 4.3 0 1 1 0-6Z"/><path d="m14 9 4 3-4 3m4-3h3"/></g></svg>', '#2767B3'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:ccb-credit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'ccb-credit', r.id, '建设银行信用卡', 'card', 116, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:ccb-credit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'ccb-credit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'ccb-credit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 汇丰香港蓝狮子万事达卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:hsbc-hk-blue-lion', '汇丰香港蓝狮子万事达卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="m2 5 7 7-7 7Zm20 0-7 7 7 7ZM4 4h16l-8 7Zm0 16h16l-8-7Z" fill="currentColor"/></svg>', '#286BA8'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:hsbc-hk-blue-lion');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'hsbc-hk-blue-lion', r.id, '汇丰香港蓝狮子万事达卡', 'card', 117, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:hsbc-hk-blue-lion'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'hsbc-hk-blue-lion');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'hsbc-hk-blue-lion'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 中信银行信用卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:citic-credit', '中信银行信用卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M5 3h5v5H5Zm9 0h5v5h-5ZM5 16h5v5H5Zm9 0h5v5h-5ZM2 10h7v4H2Zm13 0h7v4h-7Z" fill="currentColor"/></svg>', '#CF3B48'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:citic-credit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'citic-credit', r.id, '中信银行信用卡', 'card', 118, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:citic-credit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'citic-credit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'citic-credit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 平安银行信用卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:pingan-credit', '平安银行信用卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 5-11 4 8 4-8 5 11M5 13h6m2 0h6M3 20h18"/></g></svg>', '#E77731'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:pingan-credit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'pingan-credit', r.id, '平安银行信用卡', 'card', 119, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:pingan-credit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'pingan-credit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'pingan-credit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- ZABank VISA绿卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:za-visa-green', 'ZABank VISA绿卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h8l-8 12h8m3 0 4-12 4 12m-7-4h6"/></g></svg>', '#3AA94B'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:za-visa-green');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'za-visa-green', r.id, 'ZABank VISA绿卡', 'card', 120, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:za-visa-green'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'za-visa-green');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'za-visa-green'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 蚂蚁花呗
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:huabei', '蚂蚁花呗', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c-5-8-10-2-6 1l6 3m0-4c5-8 10-2 6 1l-6 3m0 0c-7-3-10 4-5 6 3 1 4-3 5-6Zm0 0c7-3 10 4 5 6-3 1-4-3-5-6ZM12 12v9"/></g></svg>', '#209FCD'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:huabei');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'huabei', r.id, '蚂蚁花呗', 'wallet', 121, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:huabei'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'huabei');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'huabei'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

-- 招商银行信用卡
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
SELECT 'account:cmb-credit', '招商银行信用卡', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m7 17 3-10 2 6 2-6 3 10M6 17h12"/></g></svg>', '#C43149'
WHERE NOT EXISTS (SELECT 1 FROM icon_resources WHERE resourceKey = 'account:cmb-credit');
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder, isDefault)
SELECT 'account', 'cmb-credit', r.id, '招商银行信用卡', 'card', 122, 0
FROM icon_resources r
WHERE r.resourceKey = 'account:cmb-credit'
  AND NOT EXISTS (SELECT 1 FROM icon_scene_options WHERE scene = 'account' AND iconKey = 'cmb-credit');
INSERT INTO account_icon_rules (optionId, accountType, accountSubType, isDefault)
SELECT o.id, 10, 0, 0 FROM icon_scene_options o
WHERE o.scene = 'account' AND o.iconKey = 'cmb-credit'
  AND NOT EXISTS (SELECT 1 FROM account_icon_rules WHERE optionId = o.id AND accountType = 10 AND accountSubType = 0);

COMMIT;
