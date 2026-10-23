CREATE TABLE expense_projects (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 userId INT NOT NULL,
 name VARCHAR(30) NOT NULL,
 iconKey VARCHAR(64) NOT NULL DEFAULT 'folder',
 startDate DATE NULL,
 endDate DATE NULL,
 remark VARCHAR(500) NULL,
 isArchived TINYINT(1) NOT NULL DEFAULT 0,
 deletedAt DATETIME(3) NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 KEY idx_expense_projects_user_status (userId, isArchived, deletedAt),
 CONSTRAINT fk_expense_projects_user FOREIGN KEY (userId) REFERENCES users(id),
 CONSTRAINT chk_expense_projects_dates CHECK (startDate IS NULL OR endDate IS NULL OR endDate >= startDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE transactions
 ADD COLUMN expenseProjectId BIGINT UNSIGNED NULL,
 ADD KEY idx_transactions_user_project_deleted_time (userId, expenseProjectId, deletedAt, transactionTime, id),
 ADD CONSTRAINT fk_transactions_expense_project FOREIGN KEY (expenseProjectId) REFERENCES expense_projects(id),
 ADD CONSTRAINT chk_transactions_expense_project CHECK (expenseProjectId IS NULL OR transactionType = 1);
