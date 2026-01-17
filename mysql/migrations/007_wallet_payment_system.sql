-- MySQL Migration 007: Wallet and Payment System
-- Converted from PostgreSQL migration: 20251225000000_add_wallet_payment_system.sql

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (balance >= 0),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transactions table (wallet transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  transaction_type ENUM('wallet_topup', 'hearing_payment', 'addon_payment', 'refund', 'admin_adjustment') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id CHAR(36),
  reference_type VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_reference (reference_id, reference_type),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create payments table (payment gateway transactions)
CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  gateway ENUM('razorpay', 'phonepe', 'wallet', 'manual') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
  gateway_transaction_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  gateway_signature TEXT,
  metadata JSON,
  failure_reason TEXT,
  refund_amount DECIMAL(10, 2) DEFAULT 0.00,
  refund_reason TEXT,
  refunded_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_gateway_transaction_id (gateway_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  payment_id CHAR(36),
  amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('draft', 'generated', 'sent', 'paid', 'cancelled') NOT NULL DEFAULT 'draft',
  invoice_data JSON,
  pdf_url TEXT,
  sent_at DATETIME,
  paid_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_user_id (user_id),
  INDEX idx_payment_id (payment_id),
  INDEX idx_invoice_number (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2),
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_code (code),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create promo_code_usage table (track who used which code)
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  promo_code_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  payment_id CHAR(36),
  invoice_id CHAR(36),
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  UNIQUE KEY unique_promo_user_payment (promo_code_id, user_id, payment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_promo_code_id (promo_code_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create addons table
CREATE TABLE IF NOT EXISTS addons (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
  max_per_case INT DEFAULT 1,
  features JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create case_addons table (add-ons applied to cases/hearings)
CREATE TABLE IF NOT EXISTS case_addons (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id CHAR(36),
  hearing_session_id CHAR(36),
  addon_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  payment_id CHAR(36),
  invoice_id CHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  activated_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (hearing_session_id) REFERENCES court_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  INDEX idx_case_id (case_id),
  INDEX idx_hearing_session_id (hearing_session_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add payment tracking columns to court_sessions
ALTER TABLE court_sessions 
  ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_id CHAR(36),
  ADD COLUMN IF NOT EXISTS invoice_id CHAR(36),
  ADD COLUMN IF NOT EXISTS court_hearing_fee DECIMAL(10, 2) DEFAULT 1200.00,
  ADD COLUMN IF NOT EXISTS lawyer_type ENUM('ai_lawyer', 'actual_lawyer'),
  ADD COLUMN IF NOT EXISTS ai_lawyer_fee DECIMAL(10, 2) DEFAULT 500.00,
  ADD COLUMN IF NOT EXISTS actual_lawyer_fee DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS actual_lawyer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS actual_lawyer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS actual_lawyer_otp VARCHAR(10),
  ADD COLUMN IF NOT EXISTS actual_lawyer_otp_expires_at DATETIME,
  ADD COLUMN IF NOT EXISTS actual_lawyer_consultation_requested BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS actual_lawyer_callback_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS total_fee DECIMAL(10, 2) DEFAULT 1200.00,
  ADD COLUMN IF NOT EXISTS payment_method ENUM('razorpay', 'phonepe', 'wallet', 'manual'),
  ADD COLUMN IF NOT EXISTS hearing_started BOOLEAN DEFAULT FALSE,
  ADD FOREIGN KEY (payment_id) REFERENCES payments(id),
  ADD FOREIGN KEY (invoice_id) REFERENCES invoices(id);

-- Insert default add-ons (Only AI Lawyer Assistant)
INSERT INTO addons (code, name, description, price, status, max_per_case, features) VALUES
(
  'ai_lawyer_assistant',
  'AI Lawyer Assistant',
  'Extra support for AI lawyer with deep search, OCR reading and understanding of case documents, media, and evidences. Includes Hash Value generation as per Indian Law Section 63(4)C for digital evidences.',
  250.00,
  'active',
  1,
  JSON_OBJECT('features', JSON_ARRAY('Deep case analysis', 'Enhanced OCR processing', 'Document understanding', 'Evidence hash generation (Section 63(4)C)', 'Advanced legal research'))
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

