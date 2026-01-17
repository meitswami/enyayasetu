-- MySQL Migration 004: Court Sessions
-- Converted from PostgreSQL migration: 20251224073955_be20b7ea-2bfb-4793-b1a5-294d6101293d.sql

-- Court Sessions table
CREATE TABLE IF NOT EXISTS court_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  court_code VARCHAR(8) NOT NULL UNIQUE,
  status ENUM('scheduled', 'in_progress', 'adjourned', 'completed') NOT NULL DEFAULT 'scheduled',
  started_at DATETIME,
  ended_at DATETIME,
  next_hearing_date DATETIME,
  adjournment_reason TEXT,
  video_recording_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_case_id (case_id),
  INDEX idx_court_code (court_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Court Participants table
CREATE TABLE IF NOT EXISTS court_participants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  participant_name VARCHAR(255) NOT NULL,
  role ENUM('judge', 'prosecutor', 'defence_lawyer', 'accused', 'victim', 'victim_family', 'accused_family', 'witness', 'audience') NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  is_ai BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Court Transcript table (real-time messages)
CREATE TABLE IF NOT EXISTS court_transcripts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  participant_id CHAR(36),
  speaker_role VARCHAR(50) NOT NULL,
  speaker_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('speech', 'action', 'document', 'objection', 'order', 'evidence') DEFAULT 'speech',
  audio_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sequence_number INT AUTO_INCREMENT,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES court_participants(id),
  INDEX idx_session_id (session_id),
  INDEX idx_participant_id (participant_id),
  INDEX idx_sequence_number (sequence_number),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hand Raise Requests table
CREATE TABLE IF NOT EXISTS court_hand_raises (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  participant_id CHAR(36) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'allowed', 'denied', 'completed') DEFAULT 'pending',
  raised_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  judge_response TEXT,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES court_participants(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_participant_id (participant_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Court Evidence Submissions (during hearing)
CREATE TABLE IF NOT EXISTS court_evidence_submissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  participant_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  ocr_text TEXT,
  ai_analysis TEXT,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_by_judge BOOLEAN,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES court_participants(id),
  INDEX idx_session_id (session_id),
  INDEX idx_participant_id (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Date Extension Requests table
CREATE TABLE IF NOT EXISTS court_date_requests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  requested_by CHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  requested_date DATETIME,
  status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
  judge_decision TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES court_participants(id),
  INDEX idx_session_id (session_id),
  INDEX idx_requested_by (requested_by),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Function to generate unique court code (MySQL stored procedure)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_court_code(OUT result VARCHAR(8))
BEGIN
  DECLARE chars VARCHAR(36) DEFAULT 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  DECLARE i INT DEFAULT 1;
  DECLARE result_temp VARCHAR(8) DEFAULT '';
  DECLARE char_index INT;
  
  WHILE i <= 8 DO
    SET char_index = FLOOR(1 + RAND() * 36);
    SET result_temp = CONCAT(result_temp, SUBSTRING(chars, char_index, 1));
    SET i = i + 1;
  END WHILE;
  
  SET result = result_temp;
END //
DELIMITER ;

