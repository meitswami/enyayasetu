-- MySQL Migration 010: Case Strength Analysis and RTI Features
-- Adds support for case strength percentage analysis and RTI (Right to Information) application

-- Case Strength Analysis Table
CREATE TABLE IF NOT EXISTS case_strength_analyses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  strength_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  analysis_data JSON,
  analyzed_documents JSON,
  analysis_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_case_id (case_id),
  INDEX idx_user_id (user_id),
  INDEX idx_analysis_date (analysis_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Strength Improvement Suggestions Table
CREATE TABLE IF NOT EXISTS case_strength_suggestions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  suggestion_type ENUM('missing_document', 'additional_evidence', 'legal_strategy') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  impact_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  document_category VARCHAR(100),
  estimated_strength_after DECIMAL(5, 2),
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_case_id (case_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_purchased (is_purchased)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RTI Applications Table
CREATE TABLE IF NOT EXISTS rti_applications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  application_number VARCHAR(100) UNIQUE,
  public_authority VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  information_requested TEXT NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_address TEXT NOT NULL,
  applicant_phone VARCHAR(20),
  applicant_email VARCHAR(255),
  applicant_pincode VARCHAR(10),
  payment_id CHAR(36),
  application_status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'appealed') NOT NULL DEFAULT 'draft',
  submitted_at DATETIME,
  fee_amount DECIMAL(10, 2) DEFAULT 10.00,
  receipt_number VARCHAR(100),
  public_authority_response TEXT,
  response_received_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_user_id (user_id),
  INDEX idx_application_number (application_number),
  INDEX idx_status (application_status),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RTI Tutorial Progress Table (tracks user progress through tutorial)
CREATE TABLE IF NOT EXISTS rti_tutorial_progress (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  section_completed VARCHAR(100) NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA FOR EXISTING EXAMPLE CASES
-- ============================================
-- This section inserts sample case strength analysis data for existing cases
-- Run this after the tables are created and you have cases in your database

-- Note: These INSERT statements use subqueries to find existing cases
-- They will only insert data if matching cases exist in your database

-- Insert sample case strength analyses for example cases
-- This will create analyses for cases matching the example case titles

INSERT INTO case_strength_analyses (id, case_id, user_id, strength_percentage, analysis_data, analyzed_documents, analysis_date)
SELECT 
  UUID() as id,
  c.id as case_id,
  c.user_id,
  CASE 
    WHEN c.title LIKE '%Land Dispute%' THEN 65.00
    WHEN c.title LIKE '%Corporate Fraud%' THEN 80.00
    WHEN c.title LIKE '%Custody Battle%' THEN 55.00
    WHEN c.title LIKE '%Industrial Corp%' OR c.title LIKE '%Environmental%' THEN 75.00
    WHEN c.title LIKE '%Patent Dispute%' THEN 70.00
    WHEN c.title LIKE '%Textile Factory%' OR c.title LIKE '%Workers Union%' THEN 60.00
    WHEN c.title LIKE '%Hospital%' OR c.title LIKE '%Medical%' THEN 85.00
    WHEN c.title LIKE '%Hackers%' OR c.title LIKE '%Cyber%' THEN 70.00
    WHEN c.title LIKE '%Developers%' OR c.title LIKE '%Homebuyers%' THEN 50.00
    WHEN c.title LIKE '%Media House%' OR c.title LIKE '%Defamation%' THEN 45.00
    WHEN c.title LIKE '%Property Dispute%' THEN 60.00
    WHEN c.title LIKE '%Theft%' THEN 70.00
    WHEN c.title LIKE '%Domestic Violence%' THEN 75.00
    WHEN c.title LIKE '%Contract Breach%' THEN 65.00
    WHEN c.title LIKE '%Motor Vehicle%' OR c.title LIKE '%Accident%' THEN 80.00
    ELSE 50.00
  END as strength_percentage,
  JSON_OBJECT(
    'documentCount', 
    CASE 
      WHEN c.title LIKE '%Land Dispute%' THEN 4
      WHEN c.title LIKE '%Corporate Fraud%' THEN 5
      WHEN c.title LIKE '%Custody Battle%' THEN 4
      WHEN c.title LIKE '%Industrial Corp%' OR c.title LIKE '%Environmental%' THEN 4
      WHEN c.title LIKE '%Patent Dispute%' THEN 4
      WHEN c.title LIKE '%Textile Factory%' OR c.title LIKE '%Workers Union%' THEN 4
      WHEN c.title LIKE '%Hospital%' OR c.title LIKE '%Medical%' THEN 4
      WHEN c.title LIKE '%Hackers%' OR c.title LIKE '%Cyber%' THEN 4
      WHEN c.title LIKE '%Developers%' OR c.title LIKE '%Homebuyers%' THEN 4
      WHEN c.title LIKE '%Media House%' OR c.title LIKE '%Defamation%' THEN 4
      ELSE 3
    END,
    'categories',
    CASE 
      WHEN c.title LIKE '%Land Dispute%' OR c.title LIKE '%Property%' THEN JSON_ARRAY('contract', 'identity', 'evidence')
      WHEN c.title LIKE '%Corporate Fraud%' THEN JSON_ARRAY('contract', 'evidence', 'witness')
      WHEN c.title LIKE '%Custody Battle%' OR c.title LIKE '%Family%' THEN JSON_ARRAY('medical', 'witness', 'identity')
      WHEN c.title LIKE '%Industrial Corp%' OR c.title LIKE '%Environmental%' THEN JSON_ARRAY('evidence', 'medical', 'witness')
      WHEN c.title LIKE '%Patent Dispute%' THEN JSON_ARRAY('contract', 'evidence')
      WHEN c.title LIKE '%Textile Factory%' OR c.title LIKE '%Workers Union%' THEN JSON_ARRAY('contract', 'witness', 'evidence')
      WHEN c.title LIKE '%Hospital%' OR c.title LIKE '%Medical%' THEN JSON_ARRAY('medical', 'contract', 'witness')
      WHEN c.title LIKE '%Hackers%' OR c.title LIKE '%Cyber%' THEN JSON_ARRAY('evidence', 'contract')
      WHEN c.title LIKE '%Developers%' OR c.title LIKE '%Homebuyers%' THEN JSON_ARRAY('contract', 'evidence')
      WHEN c.title LIKE '%Media House%' OR c.title LIKE '%Defamation%' THEN JSON_ARRAY('evidence', 'witness')
      ELSE JSON_ARRAY('evidence', 'identity')
    END,
    'analyzedAt', NOW()
  ) as analysis_data,
  JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'fileName', 'Document_1.pdf', 'category', 'contract', 'weight', 15),
    JSON_OBJECT('id', UUID(), 'fileName', 'Document_2.pdf', 'category', 'evidence', 'weight', 10),
    JSON_OBJECT('id', UUID(), 'fileName', 'Document_3.pdf', 'category', 'identity', 'weight', 5)
  ) as analyzed_documents,
  NOW() as analysis_date
FROM cases c
WHERE c.id NOT IN (SELECT case_id FROM case_strength_analyses)
  AND (
    c.title LIKE '%Land Dispute%' OR
    c.title LIKE '%Corporate Fraud%' OR
    c.title LIKE '%Custody Battle%' OR
    c.title LIKE '%Industrial Corp%' OR
    c.title LIKE '%Environmental%' OR
    c.title LIKE '%Patent Dispute%' OR
    c.title LIKE '%Textile Factory%' OR
    c.title LIKE '%Workers Union%' OR
    c.title LIKE '%Hospital%' OR
    c.title LIKE '%Medical%' OR
    c.title LIKE '%Hackers%' OR
    c.title LIKE '%Cyber%' OR
    c.title LIKE '%Developers%' OR
    c.title LIKE '%Homebuyers%' OR
    c.title LIKE '%Media House%' OR
    c.title LIKE '%Defamation%' OR
    c.title LIKE '%Property Dispute%' OR
    c.title LIKE '%Theft%' OR
    c.title LIKE '%Domestic Violence%' OR
    c.title LIKE '%Contract Breach%' OR
    c.title LIKE '%Motor Vehicle%' OR
    c.title LIKE '%Accident%'
  )
LIMIT 20;

-- Insert sample improvement suggestions for cases with strength < 70%
INSERT INTO case_strength_suggestions (id, case_id, user_id, suggestion_type, title, description, impact_percentage, priority, document_category, estimated_strength_after)
SELECT 
  UUID() as id,
  csa.case_id,
  csa.user_id,
  'missing_document' as suggestion_type,
  CASE 
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'fir') IS NULL THEN 'Add FIR or Police Complaint'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'medical') IS NULL THEN 'Add Medical Reports'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'witness') IS NULL THEN 'Add Witness Statements'
    ELSE 'Add Additional Evidence Documents'
  END as title,
  CASE 
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'fir') IS NULL THEN 'An FIR or police complaint provides official documentation of the incident and strengthens your case significantly.'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'medical') IS NULL THEN 'Medical reports provide evidence of injuries or medical conditions related to the case.'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'witness') IS NULL THEN 'Statements from witnesses who observed the incident strengthen your case significantly.'
    ELSE 'Additional evidence documents can help establish facts and support your claims.'
  END as description,
  CASE 
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'fir') IS NULL THEN 20.00
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'medical') IS NULL THEN 15.00
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'witness') IS NULL THEN 12.00
    ELSE 10.00
  END as impact_percentage,
  CASE 
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'fir') IS NULL THEN 'high'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'medical') IS NULL THEN 'high'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'witness') IS NULL THEN 'medium'
    ELSE 'medium'
  END as priority,
  CASE 
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'fir') IS NULL THEN 'fir'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'medical') IS NULL THEN 'medical'
    WHEN JSON_SEARCH(csa.analysis_data, 'one', 'witness') IS NULL THEN 'witness'
    ELSE 'evidence'
  END as document_category,
  LEAST(csa.strength_percentage + 
    CASE 
      WHEN JSON_SEARCH(csa.analysis_data, 'one', 'fir') IS NULL THEN 20.00
      WHEN JSON_SEARCH(csa.analysis_data, 'one', 'medical') IS NULL THEN 15.00
      WHEN JSON_SEARCH(csa.analysis_data, 'one', 'witness') IS NULL THEN 12.00
      ELSE 10.00
    END, 100.00) as estimated_strength_after
FROM case_strength_analyses csa
WHERE csa.strength_percentage < 70.00
  AND NOT EXISTS (
    SELECT 1 FROM case_strength_suggestions css 
    WHERE css.case_id = csa.case_id 
    AND css.suggestion_type = 'missing_document'
  )
LIMIT 15;

-- Add legal strategy suggestion for cases with strength < 60%
INSERT INTO case_strength_suggestions (id, case_id, user_id, suggestion_type, title, description, impact_percentage, priority, estimated_strength_after)
SELECT 
  UUID() as id,
  csa.case_id,
  csa.user_id,
  'legal_strategy' as suggestion_type,
  'Consult with a Legal Expert' as title,
  'Consider consulting with a lawyer to review your case and get professional legal advice on evidence collection and case strategy.' as description,
  15.00 as impact_percentage,
  'high' as priority,
  LEAST(csa.strength_percentage + 15.00, 100.00) as estimated_strength_after
FROM case_strength_analyses csa
WHERE csa.strength_percentage < 60.00
  AND NOT EXISTS (
    SELECT 1 FROM case_strength_suggestions css 
    WHERE css.case_id = csa.case_id 
    AND css.suggestion_type = 'legal_strategy'
  )
LIMIT 10;
