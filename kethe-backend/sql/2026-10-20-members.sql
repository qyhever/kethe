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

ALTER TABLE transactions
  ADD COLUMN memberId BIGINT UNSIGNED NULL AFTER categoryId,
  ADD KEY idx_transactions_user_member_time (userId, memberId, transactionTime DESC),
  ADD CONSTRAINT fk_transactions_member FOREIGN KEY (memberId) REFERENCES members(id);
