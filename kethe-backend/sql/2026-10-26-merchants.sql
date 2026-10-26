-- MySQL 8.0.16+。部署顺序：数据库升级 → 后端 → 前端。
-- DDL 仅执行一次；末尾默认数据补齐语句可单独重复执行。历史流水 merchantId 保持 NULL。
CREATE TABLE merchants (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 userId INT NOT NULL,
 name VARCHAR(30) NOT NULL,
 iconKey VARCHAR(64) NOT NULL DEFAULT 'store',
 systemKey VARCHAR(64) NULL,
 isSystemDefault TINYINT(1) NOT NULL DEFAULT 0,
 sortOrder INT NOT NULL DEFAULT 100,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 UNIQUE KEY uk_merchants_user_system (userId, systemKey),
 KEY idx_merchants_user_sort (userId, sortOrder, id),
 CONSTRAINT fk_merchants_user FOREIGN KEY (userId) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE transactions
 ADD COLUMN merchantId BIGINT UNSIGNED NULL,
 ADD KEY idx_transactions_user_merchant_deleted_time (userId, merchantId, deletedAt, transactionTime, id),
 ADD CONSTRAINT fk_transactions_merchant FOREIGN KEY (merchantId) REFERENCES merchants(id),
 ADD CONSTRAINT chk_transactions_merchant CHECK (merchantId IS NULL OR transactionType = 1);

-- 可重复执行：仅补齐缺项，保留已修改的默认商家。
INSERT INTO merchants (userId, name, iconKey, systemKey, isSystemDefault, sortOrder)
SELECT u.id, d.name, d.iconKey, d.systemKey, 1, d.sortOrder
FROM users u CROSS JOIN (
 SELECT '超市' AS name, 'shopping-cart' AS iconKey, 'merchant_supermarket' AS systemKey, 1 AS sortOrder
 UNION ALL
 SELECT '商场' AS name, 'building' AS iconKey, 'merchant_mall' AS systemKey, 2 AS sortOrder
 UNION ALL
 SELECT '亚马逊' AS name, 'globe' AS iconKey, 'merchant_amazon' AS systemKey, 3 AS sortOrder
 UNION ALL
 SELECT '淘宝' AS name, 'shopping-bag' AS iconKey, 'merchant_taobao' AS systemKey, 4 AS sortOrder
 UNION ALL
 SELECT '京东' AS name, 'package' AS iconKey, 'merchant_jd' AS systemKey, 5 AS sortOrder
 UNION ALL
 SELECT '拼多多' AS name, 'tags' AS iconKey, 'merchant_pinduoduo' AS systemKey, 6 AS sortOrder
 UNION ALL
 SELECT '其他' AS name, 'store' AS iconKey, 'merchant_other' AS systemKey, 7 AS sortOrder
) d
WHERE NOT EXISTS (SELECT 1 FROM merchants m WHERE m.userId = u.id AND m.systemKey = d.systemKey);
