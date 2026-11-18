CREATE TABLE auth_sessions (
  id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  refresh_jti CHAR(36) NOT NULL,
  device_label VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  last_active_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_auth_sessions_user_active (user_id, revoked_at, expires_at),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
