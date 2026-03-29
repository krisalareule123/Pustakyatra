-- Add payment_reference and esewa_ref_id for richer eSewa transaction tracking
-- Run this if not already applied
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(200) NULL AFTER transaction_code,
  ADD COLUMN IF NOT EXISTS esewa_ref_id VARCHAR(100) NULL AFTER payment_reference;

-- Index for faster lookups by transaction
CREATE INDEX IF NOT EXISTS idx_orders_transaction_uuid ON orders(transaction_uuid);
CREATE INDEX IF NOT EXISTS idx_orders_reader_status ON orders(reader_id, status);
