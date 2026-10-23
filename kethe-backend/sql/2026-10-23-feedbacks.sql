-- 发布时先执行建表，再部署反馈接口与页面。
SET NAMES utf8mb4;

CREATE TABLE feedbacks (
  id INT NOT NULL AUTO_INCREMENT COMMENT 'Unique identifier',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
  userId INT NOT NULL,
  content VARCHAR(1000) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_feedbacks_user_created (userId, createdAt),
  CONSTRAINT fk_feedbacks_user FOREIGN KEY (userId) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
