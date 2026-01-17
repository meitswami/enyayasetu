-- MySQL Migration 008: Payment Gateway Settings
-- Converted from PostgreSQL migration: 20251225000001_add_payment_gateway_settings.sql

-- Payment Gateway Settings Table
-- Only one payment gateway can be active at a time
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  gateway ENUM('razorpay', 'phonepe', 'wallet', 'manual') NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  api_key TEXT,
  api_secret TEXT,
  merchant_id VARCHAR(255),
  salt_key VARCHAR(255),
  salt_index VARCHAR(50),
  webhook_url TEXT,
  test_mode BOOLEAN DEFAULT TRUE,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default entries (both inactive)
INSERT INTO payment_gateway_settings (gateway, is_active) VALUES
  ('razorpay', FALSE),
  ('phonepe', FALSE)
ON DUPLICATE KEY UPDATE gateway = VALUES(gateway);

-- Trigger to ensure only one gateway is active (MySQL)
DELIMITER //
CREATE TRIGGER IF NOT EXISTS enforce_single_active_gateway_before_insert
BEFORE INSERT ON payment_gateway_settings
FOR EACH ROW
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE payment_gateway_settings
    SET is_active = FALSE, updated_at = NOW()
    WHERE gateway != NEW.gateway AND is_active = TRUE;
  END IF;
END //

CREATE TRIGGER IF NOT EXISTS enforce_single_active_gateway_before_update
BEFORE UPDATE ON payment_gateway_settings
FOR EACH ROW
BEGIN
  IF NEW.is_active = TRUE AND OLD.is_active = FALSE THEN
    UPDATE payment_gateway_settings
    SET is_active = FALSE, updated_at = NOW()
    WHERE gateway != NEW.gateway AND is_active = TRUE;
  END IF;
END //
DELIMITER ;

