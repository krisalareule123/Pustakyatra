-- Run this in phpMyAdmin to add missing columns to the books table
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS author_id    INT NULL AFTER book_id,
  ADD COLUMN IF NOT EXISTS nepali_title VARCHAR(255) NULL AFTER title,
  ADD COLUMN IF NOT EXISTS description  TEXT NULL AFTER nepali_title,
  ADD COLUMN IF NOT EXISTS category     VARCHAR(100) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS language     VARCHAR(50) DEFAULT 'Nepali' AFTER category,
  ADD COLUMN IF NOT EXISTS keywords     VARCHAR(500) NULL AFTER language,
  ADD COLUMN IF NOT EXISTS buy_price    DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER keywords,
  ADD COLUMN IF NOT EXISTS rent_price   DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER buy_price,
  ADD COLUMN IF NOT EXISTS rent_days    INT NOT NULL DEFAULT 15 AFTER rent_price,
  ADD COLUMN IF NOT EXISTS status       ENUM('draft','published') DEFAULT 'published' AFTER rent_days,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add index for fast author lookups
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_status    ON books(status);
