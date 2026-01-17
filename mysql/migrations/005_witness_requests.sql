-- MySQL Migration 005: Witness Requests
-- Converted from PostgreSQL migration: 20251224074006_affbc10c-53b9-4711-aeb4-6056862b4397.sql

-- Create witness requests table
CREATE TABLE IF NOT EXISTS court_witness_requests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  requested_by CHAR(36) NOT NULL,
  witness_name VARCHAR(255) NOT NULL,
  witness_description TEXT,
  relevance TEXT NOT NULL,
  status ENUM('pending', 'summoned', 'denied', 'present', 'testified') DEFAULT 'pending',
  judge_response TEXT,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  testified_at DATETIME,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES court_participants(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_requested_by (requested_by),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

