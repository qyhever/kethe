-- 用户 14 近 3 个月测试流水数据
-- MySQL 8.0+
--
-- 说明：
-- 1. 共生成 400 条流水：320 条支出、60 条收入、20 条转账。
-- 2. 金额单位为分，交易时间为执行时刻前 90 天内。
-- 3. 账户和分类通过 systemKey 解析，不依赖自增 ID。
-- 4. 执行前请确保用户 14 已完成默认账户和默认分类初始化。
-- 5. 脚本不会删除已有数据，重复执行会追加一批新的测试流水。

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
WITH RECURSIVE sequence_numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1
    FROM sequence_numbers
    WHERE n < 400
), transaction_data AS (
    SELECT
        n,
        CASE
            WHEN MOD(n, 20) = 0 THEN 3
            WHEN MOD(n, 20) BETWEEN 17 AND 19 THEN 2
            ELSE 1
        END AS transactionType,
        CASE
            WHEN MOD(n, 20) = 0 THEN NULL
            WHEN MOD(n, 20) BETWEEN 17 AND 19 THEN ELT(
                MOD(n - 1, 6) + 1,
                'income_salary',
                'income_bonus',
                'income_part_time',
                'income_investment',
                'income_gift',
                'income_other'
            )
            ELSE ELT(
                MOD(n - 1, 12) + 1,
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
            MOD(n - 1, 5) + 1,
            'cash',
            'bank_card',
            'paypal',
            'wechat',
            'alipay'
        ) AS accountKey,
        CASE
            WHEN MOD(n, 20) = 0 THEN ELT(
                MOD(n - 1, 5) + 1,
                'bank_card',
                'wechat',
                'alipay',
                'cash',
                'paypal'
            )
            ELSE NULL
        END AS targetAccountKey,
        TIMESTAMPADD(
            MINUTE,
            ((n - 1) * 320 + MOD(n * 37, 180)),
            DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 90 DAY)
        ) AS transactionTime
    FROM sequence_numbers
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
        WHEN transactionType = 3 THEN 10000 + MOD(n * 113, 300000)
        WHEN categoryKey = 'expense_housing' THEN 150000 + MOD(n * 731, 400000)
        WHEN categoryKey = 'expense_education' THEN 8000 + MOD(n * 239, 60000)
        WHEN categoryKey = 'expense_medical' THEN 3000 + MOD(n * 307, 120000)
        WHEN categoryKey = 'expense_gift' THEN 5000 + MOD(n * 419, 100000)
        WHEN categoryKey = 'expense_entertainment' THEN 1000 + MOD(n * 173, 50000)
        WHEN categoryKey = 'income_salary' THEN 800000 + MOD(n * 137, 400000)
        WHEN categoryKey = 'income_bonus' THEN 50000 + MOD(n * 191, 300000)
        WHEN categoryKey = 'income_part_time' THEN 10000 + MOD(n * 157, 100000)
        WHEN categoryKey = 'income_investment' THEN 5000 + MOD(n * 127, 80000)
        WHEN categoryKey = 'income_gift' THEN 10000 + MOD(n * 211, 100000)
        WHEN transactionType = 2 THEN 1000 + MOD(n * 97, 50000)
        ELSE 300 + MOD(n * 173, 25000)
    END,
    categoryId,
    accountId,
    targetAccountId,
    'CNY',
    CONCAT(
        '近3个月测试流水-',
        @demo_batch_tag,
        '-',
        LPAD(n, 3, '0'),
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
    ),
    transactionTime
FROM resolved_data;

-- 执行后应返回 400；若少于 400，通常是用户 14 的账户或分类尚未初始化。
SELECT COUNT(*) AS generated_count
FROM transactions
WHERE userId = @demo_user_id
  AND remark LIKE CONCAT('近3个月测试流水-', @demo_batch_tag, '-%')
  AND transactionTime >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 90 DAY);
