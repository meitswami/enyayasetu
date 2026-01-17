-- MySQL Migration 001: Initial Schema
-- Converted from PostgreSQL migration: 20251223131621_957d7896-719d-4acd-8da3-1d601a7bfd18.sql

-- Create users table (replaces auth.users from Supabase)
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  raw_user_meta_data JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  case_number VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  plaintiff VARCHAR(255) NOT NULL,
  defendant VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Custom Case',
  status ENUM('pending', 'in_progress', 'adjourned', 'verdict_delivered', 'closed') DEFAULT 'pending',
  user_role ENUM('audience', 'judge', 'steno', 'public_prosecutor', 'defence_lawyer', 'pp_assistant', 'defence_assistant', 'accused', 'victim', 'victim_family', 'accused_family', 'police_staff') NOT NULL,
  next_hearing_date DATE,
  verdict TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_case_number (case_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create evidence table for media uploads
CREATE TABLE IF NOT EXISTS case_evidence (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(255),
  provided_by ENUM('prosecution', 'defence', 'court', 'police') NOT NULL,
  description TEXT,
  ai_analysis TEXT,
  uploaded_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_case_id (case_id),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create hearing sessions table
CREATE TABLE IF NOT EXISTS hearing_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  session_number INT NOT NULL DEFAULT 1,
  session_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transcripts table for chat/voice records
CREATE TABLE IF NOT EXISTS hearing_transcripts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  speaker_role ENUM('audience', 'judge', 'steno', 'public_prosecutor', 'defence_lawyer', 'pp_assistant', 'defence_assistant', 'accused', 'victim', 'victim_family', 'accused_family', 'police_staff') NOT NULL,
  speaker_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  voice_recording_url TEXT,
  sequence_number INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES hearing_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_sequence_number (sequence_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create adjournment dates table
CREATE TABLE IF NOT EXISTS case_adjournments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  requested_by ENUM('audience', 'judge', 'steno', 'public_prosecutor', 'defence_lawyer', 'pp_assistant', 'defence_assistant', 'accused', 'victim', 'victim_family', 'accused_family', 'police_staff') NOT NULL,
  requested_date DATE NOT NULL,
  reason TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approved_by ENUM('audience', 'judge', 'steno', 'public_prosecutor', 'defence_lawyer', 'pp_assistant', 'defence_assistant', 'accused', 'victim', 'victim_family', 'accused_family', 'police_staff'),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create knowledge base table for custom documents
CREATE TABLE IF NOT EXISTS knowledge_base (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type VARCHAR(100),
  category VARCHAR(100) DEFAULT 'general',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

