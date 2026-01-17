-- MySQL Migration 002: Case Intake and Reports
-- Converted from PostgreSQL migration: 20251223132409_91c0428b-f26d-4838-85ce-cd3e4bb5734a.sql

-- Add callback info to cases table
ALTER TABLE cases 
  ADD COLUMN IF NOT EXISTS callback_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS processing_eta DATETIME,
  ADD COLUMN IF NOT EXISTS ai_processing_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS uploaded_by_relation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS involved_person_status VARCHAR(100);

-- Create case intake conversations table
CREATE TABLE IF NOT EXISTS case_intake_messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('text', 'voice', 'file_upload', 'ocr_result') DEFAULT 'text',
  voice_recording_url TEXT,
  file_url TEXT,
  ocr_extracted_text TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_case_id (case_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create FIR/case reports table
CREATE TABLE IF NOT EXISTS case_reports (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  report_type ENUM('fir', 'sir', 'fr', 'chargesheet', 'other') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  ocr_text TEXT,
  ai_summary TEXT,
  uploaded_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_case_id (case_id),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

