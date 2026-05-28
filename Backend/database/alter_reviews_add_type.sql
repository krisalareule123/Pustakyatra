-- Add review_type column to distinguish public ratings from private author feedback
-- Run this once against your database

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS review_type ENUM('public', 'private') NOT NULL DEFAULT 'public' AFTER comment,
  ADD COLUMN IF NOT EXISTS status ENUM('pending', 'visible', 'hidden') NOT NULL DEFAULT 'pending' AFTER review_type;

-- Existing reviews are public ratings — mark them visible so they still appear
UPDATE reviews SET review_type = 'public', status = 'visible' WHERE review_type = 'public' AND status = 'pending';

-- Update the unique key: a reader can have one public review AND one private feedback per book
ALTER TABLE reviews DROP INDEX IF EXISTS unique_reader_book;
ALTER TABLE reviews ADD UNIQUE KEY unique_reader_book_type (reader_id, book_id, review_type);
