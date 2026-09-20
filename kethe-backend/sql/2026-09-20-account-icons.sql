-- 账户图标改为受控的稳定标识，图标资源由前端预置。

UPDATE accounts
SET icon = NULL
WHERE icon IS NOT NULL
  AND icon NOT IN (
    'cash',
    'credit-card',
    'consumer-credit',
    'bank-card',
    'savings',
    'wallet',
    'wechat',
    'alipay',
    'paypal',
    'stored-value-card',
    'voucher',
    'coins'
  );

ALTER TABLE accounts
  CHANGE COLUMN icon iconKey VARCHAR(64) DEFAULT NULL
    COMMENT '账户图标标识，例如cash、bank-card、wechat';

UPDATE accounts
SET iconKey = CASE systemKey
  WHEN 'cash' THEN 'cash'
  WHEN 'bank_card' THEN 'bank-card'
  WHEN 'paypal' THEN 'paypal'
  WHEN 'wechat' THEN 'wechat'
  WHEN 'alipay' THEN 'alipay'
  ELSE iconKey
END
WHERE systemKey IS NOT NULL;
