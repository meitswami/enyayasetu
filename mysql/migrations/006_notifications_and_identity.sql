-- MySQL Migration 006: Notifications and Identity Verification
-- Converted from PostgreSQL migration: 20251224090218_7c825ecf-01f2-42d4-bf69-0c2180b4bbe2.sql

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error', 'summon', 'approval', 'status_change') NOT NULL DEFAULT 'info',
  related_case_id CHAR(36),
  related_session_id CHAR(36),
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (related_session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create identity verification requests table
CREATE TABLE IF NOT EXISTS identity_verifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  full_name VARCHAR(255) NOT NULL,
  father_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  relation_to_case ENUM('victim', 'accused', 'victim_family', 'accused_family', 'witness', 'legal_representative') NOT NULL,
  id_document_type ENUM('aadhar', 'driving_license', 'passport') NOT NULL,
  id_document_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  face_match_percentage DECIMAL(5,2),
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  intent ENUM('know_more', 'add_info') NOT NULL,
  admin_notes TEXT,
  reviewed_by CHAR(36),
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_case_id (case_id),
  INDEX idx_user_id (user_id),
  INDEX idx_verification_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create AI usage log table for admin dashboard
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  session_id CHAR(36),
  case_id CHAR(36),
  model_used VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_case_id (case_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

