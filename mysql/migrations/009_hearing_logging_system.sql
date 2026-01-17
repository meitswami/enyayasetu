-- MySQL Migration 009: Hearing Logging System
-- Converted from PostgreSQL migration: 20251226000000_add_hearing_logging_system.sql

-- Main hearing log table - tracks overall hearing session details
CREATE TABLE IF NOT EXISTS hearing_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  case_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  payment_id CHAR(36),
  payment_transaction_number VARCHAR(255),
  invoice_id CHAR(36),
  lawyer_type ENUM('ai_lawyer', 'actual_lawyer'),
  ai_lawyer_id VARCHAR(255),
  actual_lawyer_id VARCHAR(255),
  actual_lawyer_email VARCHAR(255),
  actual_lawyer_name VARCHAR(255),
  addons_applied JSON DEFAULT (JSON_ARRAY()),
  hearing_started_at DATETIME,
  hearing_ended_at DATETIME,
  total_duration_seconds INT,
  adjourned_at DATETIME,
  completed_at DATETIME,
  video_recording_id VARCHAR(255),
  video_recording_url TEXT,
  status ENUM('started', 'in_progress', 'adjourned', 'completed', 'cancelled') NOT NULL DEFAULT 'started',
  adjournment_reason TEXT,
  completion_reason TEXT,
  metadata JSON DEFAULT (JSON_OBJECT()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  INDEX idx_session_id (session_id),
  INDEX idx_case_id (case_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detailed transcript log table
CREATE TABLE IF NOT EXISTS hearing_transcript_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hearing_log_id CHAR(36) NOT NULL,
  session_id CHAR(36) NOT NULL,
  transcript_id CHAR(36),
  participant_id CHAR(36),
  speaker_role VARCHAR(50) NOT NULL,
  speaker_name VARCHAR(255) NOT NULL,
  speaker_type ENUM('judge', 'lawyer', 'prosecutor', 'defence_lawyer', 'accused', 'victim', 'witness', 'police', 'steno', 'audience', 'other'),
  is_ai_speaker BOOLEAN DEFAULT FALSE,
  is_real_person BOOLEAN DEFAULT TRUE,
  message TEXT NOT NULL,
  message_type ENUM('speech', 'action', 'document', 'objection', 'order', 'evidence', 'question', 'answer', 'statement') DEFAULT 'speech',
  spoken_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INT,
  audio_url TEXT,
  video_timestamp_seconds INT,
  context_before TEXT,
  context_after TEXT,
  sequence_number INT NOT NULL,
  metadata JSON DEFAULT (JSON_OBJECT()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hearing_log_id) REFERENCES hearing_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (transcript_id) REFERENCES court_transcripts(id),
  FOREIGN KEY (participant_id) REFERENCES court_participants(id),
  INDEX idx_hearing_log_id (hearing_log_id),
  INDEX idx_session_id (session_id),
  INDEX idx_participant_id (participant_id),
  INDEX idx_spoken_at (spoken_at),
  INDEX idx_speaker_type (speaker_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evidence and media submission log table
CREATE TABLE IF NOT EXISTS hearing_evidence_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hearing_log_id CHAR(36) NOT NULL,
  session_id CHAR(36) NOT NULL,
  evidence_submission_id CHAR(36),
  submitted_by_participant_id CHAR(36),
  submitted_by_user_id CHAR(36),
  submitted_by_name VARCHAR(255) NOT NULL,
  submitted_by_role VARCHAR(50) NOT NULL,
  submitted_by_side ENUM('plaintiff', 'defendant', 'court', 'other'),
  evidence_type ENUM('document', 'image', 'video', 'audio', 'other') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT,
  file_hash VARCHAR(255),
  processing_started_at DATETIME,
  processing_completed_at DATETIME,
  processing_duration_seconds INT,
  processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  processing_error TEXT,
  ocr_text TEXT,
  ai_analysis TEXT,
  ai_analysis_duration_seconds INT,
  judge_decision ENUM('accepted', 'rejected', 'pending'),
  judge_decision_at DATETIME,
  judge_decision_reason TEXT,
  presented_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  presentation_duration_seconds INT,
  metadata JSON DEFAULT (JSON_OBJECT()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hearing_log_id) REFERENCES hearing_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_submission_id) REFERENCES court_evidence_submissions(id),
  FOREIGN KEY (submitted_by_participant_id) REFERENCES court_participants(id),
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id),
  INDEX idx_hearing_log_id (hearing_log_id),
  INDEX idx_session_id (session_id),
  INDEX idx_submitted_by (submitted_by_participant_id),
  INDEX idx_presented_at (presented_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Participant activity log table
CREATE TABLE IF NOT EXISTS hearing_participant_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hearing_log_id CHAR(36) NOT NULL,
  session_id CHAR(36) NOT NULL,
  participant_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  participant_name VARCHAR(255) NOT NULL,
  participant_role VARCHAR(50) NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  is_real_person BOOLEAN DEFAULT TRUE,
  activity_type ENUM('joined', 'left', 'spoke', 'raised_hand', 'submitted_evidence', 'objected', 'requested_date', 'requested_witness', 'reacted', 'other') NOT NULL,
  activity_description TEXT,
  activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INT,
  related_transcript_id CHAR(36),
  related_evidence_id CHAR(36),
  related_hand_raise_id CHAR(36),
  metadata JSON DEFAULT (JSON_OBJECT()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hearing_log_id) REFERENCES hearing_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES court_participants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_transcript_id) REFERENCES hearing_transcript_logs(id),
  FOREIGN KEY (related_evidence_id) REFERENCES hearing_evidence_logs(id),
  FOREIGN KEY (related_hand_raise_id) REFERENCES court_hand_raises(id),
  INDEX idx_hearing_log_id (hearing_log_id),
  INDEX idx_session_id (session_id),
  INDEX idx_participant_id (participant_id),
  INDEX idx_activity_type (activity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interaction log table
CREATE TABLE IF NOT EXISTS hearing_interaction_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hearing_log_id CHAR(36) NOT NULL,
  session_id CHAR(36) NOT NULL,
  initiator_participant_id CHAR(36),
  initiator_name VARCHAR(255) NOT NULL,
  initiator_role VARCHAR(50) NOT NULL,
  initiator_type ENUM('judge', 'lawyer', 'prosecutor', 'defence_lawyer', 'police', 'witness', 'accused', 'victim', 'other'),
  recipient_participant_id CHAR(36),
  recipient_name VARCHAR(255),
  recipient_role VARCHAR(50),
  recipient_type VARCHAR(50),
  interaction_type ENUM('question', 'answer', 'objection', 'order', 'request', 'response', 'statement', 'cross_examination', 'direct_examination', 'other') NOT NULL,
  interaction_subject TEXT,
  initiator_transcript TEXT NOT NULL,
  recipient_transcript TEXT,
  is_police_interaction BOOLEAN DEFAULT FALSE,
  police_person_name VARCHAR(255),
  police_person_id VARCHAR(255),
  police_person_rank VARCHAR(100),
  police_statement TEXT,
  police_questioned_by VARCHAR(255),
  police_questioned_by_role VARCHAR(50),
  interaction_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  interaction_ended_at DATETIME,
  interaction_duration_seconds INT,
  related_transcript_log_ids JSON,
  metadata JSON DEFAULT (JSON_OBJECT()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hearing_log_id) REFERENCES hearing_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (initiator_participant_id) REFERENCES court_participants(id),
  FOREIGN KEY (recipient_participant_id) REFERENCES court_participants(id),
  INDEX idx_hearing_log_id (hearing_log_id),
  INDEX idx_session_id (session_id),
  INDEX idx_initiator (initiator_participant_id),
  INDEX idx_recipient (recipient_participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document processing log table
CREATE TABLE IF NOT EXISTS hearing_document_processing_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  hearing_log_id CHAR(36) NOT NULL,
  evidence_log_id CHAR(36),
  session_id CHAR(36) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_url TEXT NOT NULL,
  document_size_bytes BIGINT,
  processing_step ENUM('upload', 'ocr', 'ai_analysis', 'verification', 'indexing', 'other') NOT NULL,
  processing_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processing_completed_at DATETIME,
  processing_duration_seconds INT,
  processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'processing',
  processing_error TEXT,
  processing_result JSON,
  output_text TEXT,
  metadata JSON DEFAULT (JSON_OBJECT()),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hearing_log_id) REFERENCES hearing_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_log_id) REFERENCES hearing_evidence_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  INDEX idx_hearing_log_id (hearing_log_id),
  INDEX idx_evidence_log_id (evidence_log_id),
  INDEX idx_processing_step (processing_step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger to automatically calculate duration when hearing ends
-- Note: MySQL doesn't support IF NOT EXISTS for triggers, so drop first if exists
-- Also, MySQL doesn't support "BEFORE INSERT OR UPDATE", so we need separate triggers
-- For phpMyAdmin compatibility, we use simpler SET syntax instead of BEGIN/END blocks

DROP TRIGGER IF EXISTS calculate_hearing_duration_before_insert;
DROP TRIGGER IF EXISTS calculate_hearing_duration_before_update;

-- Trigger for INSERT (phpMyAdmin compatible - single statement)
-- Calculates duration if both start and end times are provided
CREATE TRIGGER calculate_hearing_duration_before_insert
BEFORE INSERT ON hearing_logs
FOR EACH ROW
SET NEW.total_duration_seconds = IF(
  NEW.hearing_ended_at IS NOT NULL AND NEW.hearing_started_at IS NOT NULL,
  TIMESTAMPDIFF(SECOND, NEW.hearing_started_at, NEW.hearing_ended_at),
  NULL
),
NEW.updated_at = NOW();

-- Trigger for UPDATE (phpMyAdmin compatible - single statement)
-- Recalculates duration if both start and end times are provided, otherwise keeps existing value
CREATE TRIGGER calculate_hearing_duration_before_update
BEFORE UPDATE ON hearing_logs
FOR EACH ROW
SET NEW.total_duration_seconds = IF(
  NEW.hearing_ended_at IS NOT NULL AND NEW.hearing_started_at IS NOT NULL,
  TIMESTAMPDIFF(SECOND, NEW.hearing_started_at, NEW.hearing_ended_at),
  NEW.total_duration_seconds
),
NEW.updated_at = NOW();

