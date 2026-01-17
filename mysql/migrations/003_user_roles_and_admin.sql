-- MySQL Migration 003: User Roles and Admin
-- Converted from PostgreSQL migration: 20251223140050_b9638308-5dde-42f0-b550-682d9e423199.sql

-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert admin role for superadmin user (if exists)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'superadmin@enyayasetu.test'
ON DUPLICATE KEY UPDATE role = 'admin';

