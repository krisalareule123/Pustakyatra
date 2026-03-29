-- Add eSewa transaction details to orders table
ALTER TABLE orders
  ADD COLUMN transaction_uuid VARCHAR(100) NULL AFTER status,
  ADD COLUMN transaction_code VARCHAR(100) NULL AFTER transaction_uuid,
  ADD COLUMN paid_at TIMESTAMP NULL AFTER transaction_code;
