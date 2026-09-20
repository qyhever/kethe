-- 用户 14 近一年测试流水数据
-- MySQL 8.0+
--
-- 说明：
-- 1. 覆盖执行当天及此前 364 天，共 365 个自然日。
-- 2. 每天生成 3～5 条流水，共 1459 条；包含支出、收入和转账。
-- 3. 金额单位为分，账户和分类通过 systemKey 解析，不依赖自增 ID。
-- 4. 执行前请确保用户 14 已存在，且已完成默认账户和默认分类初始化。
-- 5. 脚本不会删除已有数据；重复执行会追加一批带有不同批次标记的数据。

SET @demo_user_id := 14;
SET @demo_batch_tag := DATE_FORMAT(CURRENT_TIMESTAMP(3), '%Y%m%d%H%i%s%f');

INSERT INTO transactions (
    userId,
    transactionType,
    amount,
    categoryId,
    accountId,
    targetAccountId,
    currency,
    remark,
    transactionTime
)
WITH RECURSIVE calendar_days AS (
    SELECT 0 AS dayOffset
    UNION ALL
    SELECT dayOffset + 1
    FROM calendar_days
    WHERE dayOffset < 364
), daily_slots AS (
    SELECT 1 AS slotNo
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
), generated_rows AS (
    SELECT
        d.dayOffset,
        s.slotNo,
        d.dayOffset * 5 + s.slotNo AS sequenceNo,
        DATE_SUB(CURRENT_DATE, INTERVAL (364 - d.dayOffset) DAY) AS transactionDate
    FROM calendar_days AS d
    INNER JOIN daily_slots AS s
        ON s.slotNo <= 3 + MOD(d.dayOffset, 3)
), transaction_data AS (
    SELECT
        g.*,
        CASE
            WHEN MOD(g.sequenceNo, 23) = 0 THEN 3
            WHEN MOD(g.sequenceNo, 11) = 0 THEN 2
            ELSE 1
        END AS transactionType,
        CASE
            WHEN MOD(g.sequenceNo, 23) = 0 THEN NULL
            WHEN MOD(g.sequenceNo, 11) = 0 THEN ELT(
                MOD(g.sequenceNo - 1, 6) + 1,
                'income_salary',
                'income_bonus',
                'income_part_time',
                'income_investment',
                'income_gift',
                'income_other'
            )
            ELSE ELT(
                MOD(g.sequenceNo - 1, 12) + 1,
                'expense_food',
                'expense_transport',
                'expense_shopping',
                'expense_housing',
                'expense_entertainment',
                'expense_medical',
                'expense_education',
                'expense_gift',
                'expense_communication',
                'expense_subscription',
                'expense_finance',
                'expense_other'
            )
        END AS categoryKey,
        ELT(
            MOD(g.sequenceNo - 1, 5) + 1,
            'cash',
            'bank_card',
            'paypal',
            'wechat',
            'alipay'
        ) AS accountKey,
        CASE
            WHEN MOD(g.sequenceNo, 23) = 0 THEN ELT(
                MOD(g.sequenceNo - 1, 5) + 1,
                'bank_card',
                'paypal',
                'wechat',
                'alipay',
                'cash'
            )
            ELSE NULL
        END AS targetAccountKey,
        CASE
            WHEN g.transactionDate = CURRENT_DATE THEN
                DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL (6 - g.slotNo) MINUTE)
            ELSE
                TIMESTAMP(
                    g.transactionDate,
                    MAKETIME(
                        7 + MOD(g.sequenceNo * 7, 15),
                        MOD(g.sequenceNo * 17, 60),
                        MOD(g.sequenceNo * 13, 60)
                    )
                )
        END AS transactionTime
    FROM generated_rows AS g
), resolved_data AS (
    SELECT
        d.*,
        c.id AS categoryId,
        a.id AS accountId,
        ta.id AS targetAccountId
    FROM transaction_data AS d
    INNER JOIN users AS u
        ON u.id = @demo_user_id
       AND u.deletedAt IS NULL
    INNER JOIN accounts AS a
        ON a.userId = @demo_user_id
       AND a.systemKey = d.accountKey
       AND a.isEnabled = 1
       AND a.deletedAt IS NULL
    LEFT JOIN accounts AS ta
        ON ta.userId = @demo_user_id
       AND ta.systemKey = d.targetAccountKey
       AND ta.isEnabled = 1
       AND ta.deletedAt IS NULL
    LEFT JOIN categories AS c
        ON c.userId = @demo_user_id
       AND c.systemKey = d.categoryKey
       AND c.categoryType = d.transactionType
       AND c.isEnabled = 1
       AND c.deletedAt IS NULL
)
SELECT
    @demo_user_id,
    transactionType,
    CASE
        WHEN transactionType = 3 THEN 10000 + MOD(sequenceNo * 113, 300000)
        WHEN categoryKey = 'expense_housing' THEN 150000 + MOD(sequenceNo * 731, 400000)
        WHEN categoryKey = 'expense_education' THEN 8000 + MOD(sequenceNo * 239, 60000)
        WHEN categoryKey = 'expense_medical' THEN 3000 + MOD(sequenceNo * 307, 120000)
        WHEN categoryKey = 'expense_gift' THEN 5000 + MOD(sequenceNo * 419, 100000)
        WHEN categoryKey = 'expense_entertainment' THEN 1000 + MOD(sequenceNo * 173, 50000)
        WHEN categoryKey = 'income_salary' THEN 800000 + MOD(sequenceNo * 137, 400000)
        WHEN categoryKey = 'income_bonus' THEN 50000 + MOD(sequenceNo * 191, 300000)
        WHEN categoryKey = 'income_part_time' THEN 10000 + MOD(sequenceNo * 157, 100000)
        WHEN categoryKey = 'income_investment' THEN 5000 + MOD(sequenceNo * 127, 80000)
        WHEN categoryKey = 'income_gift' THEN 10000 + MOD(sequenceNo * 211, 100000)
        WHEN transactionType = 2 THEN 1000 + MOD(sequenceNo * 97, 50000)
        ELSE 300 + MOD(sequenceNo * 173, 25000)
    END AS amount,
    categoryId,
    accountId,
    targetAccountId,
    'CNY',
    CONCAT(
        '近一年测试流水-',
        @demo_batch_tag,
        '-',
        LPAD(sequenceNo, 4, '0'),
        '-',
        CASE
            WHEN transactionType = 3 THEN '账户转账'
            WHEN categoryKey = 'expense_food' THEN '餐饮'
            WHEN categoryKey = 'expense_transport' THEN '交通'
            WHEN categoryKey = 'expense_shopping' THEN '购物'
            WHEN categoryKey = 'expense_housing' THEN '住房'
            WHEN categoryKey = 'expense_entertainment' THEN '娱乐'
            WHEN categoryKey = 'expense_medical' THEN '医疗'
            WHEN categoryKey = 'expense_education' THEN '教育'
            WHEN categoryKey = 'expense_gift' THEN '人情'
            WHEN categoryKey = 'expense_communication' THEN '通讯'
            WHEN categoryKey = 'expense_subscription' THEN '订阅'
            WHEN categoryKey = 'expense_finance' THEN '金融'
            WHEN categoryKey = 'expense_other' THEN '其他支出'
            WHEN categoryKey = 'income_salary' THEN '工资'
            WHEN categoryKey = 'income_bonus' THEN '奖金'
            WHEN categoryKey = 'income_part_time' THEN '兼职'
            WHEN categoryKey = 'income_investment' THEN '理财'
            WHEN categoryKey = 'income_gift' THEN '礼金'
            ELSE '其他收入'
        END
    ) AS remark,
    transactionTime
FROM resolved_data
WHERE
    (transactionType IN (1, 2) AND categoryId IS NOT NULL)
    OR
    (transactionType = 3 AND targetAccountId IS NOT NULL);

-- 应返回 generated_count = 1459、covered_days = 365、min_daily_count = 3、max_daily_count = 5。
-- 若 generated_count 少于 1459，通常是用户 14 的默认账户或默认分类尚未初始化。
SELECT
    COUNT(*) AS generated_count,
    COUNT(DISTINCT DATE(transactionTime)) AS covered_days,
    MIN(dailyCount) AS min_daily_count,
    MAX(dailyCount) AS max_daily_count
FROM transactions AS t
INNER JOIN (
    SELECT DATE(transactionTime) AS transactionDate, COUNT(*) AS dailyCount
    FROM transactions
    WHERE userId = @demo_user_id
      AND remark LIKE CONCAT('近一年测试流水-', @demo_batch_tag, '-%')
    GROUP BY DATE(transactionTime)
) AS daily
    ON daily.transactionDate = DATE(t.transactionTime)
WHERE t.userId = @demo_user_id
  AND t.remark LIKE CONCAT('近一年测试流水-', @demo_batch_tag, '-%');
