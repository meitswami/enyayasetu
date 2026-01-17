-- MySQL Migration 011: Microsoft Authenticator 2FA System
-- Master access control for landing page - only owner can access
-- Single record system (not per-user)

-- Master Authenticator Secret Table
-- Stores single TOTP secret for owner access control
CREATE TABLE IF NOT EXISTS master_authenticator_secret (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  owner_name VARCHAR(255) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  backup_codes JSON,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  setup_completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Authenticator Access Attempts Table
-- Stores all access attempts with Full Name and OTP verification status
CREATE TABLE IF NOT EXISTS authenticator_access_attempts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6),
  is_successful BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_full_name (full_name),
  INDEX idx_is_successful (is_successful),
  INDEX idx_attempted_at (attempted_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
