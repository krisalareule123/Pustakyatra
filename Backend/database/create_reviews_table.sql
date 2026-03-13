-- Create reviews table for Pustakyatra
CREATE TABLE IF NOT EXISTS reviews (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  reader_id INT NOT NULL,
  book_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reader_id) REFERENCES readers(reader_id) ON DELETE CASCADE,
  UNIQUE KEY unique_reader_book (reader_id, book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster queries
CREATE INDEX idx_book_id ON reviews(book_id);
CREATE INDEX idx_reader_id ON reviews(reader_id);
CREATE INDEX idx_rating ON reviews(rating);
