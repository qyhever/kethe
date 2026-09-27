-- 历史流水均按原有精确时刻处理。
ALTER TABLE transactions
  ADD COLUMN timePrecision TINYINT UNSIGNED NOT NULL DEFAULT 2
    COMMENT '时间精度：1仅日期，2日期和时刻'
    AFTER transactionTime,
  ADD CONSTRAINT chk_transactions_time_precision
    CHECK (timePrecision IN (1, 2));
