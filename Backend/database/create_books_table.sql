-- Books table — stores real book data uploaded by authors
CREATE TABLE IF NOT EXISTS books (
  book_id       INT PRIMARY KEY AUTO_INCREMENT,
  author_id     INT NOT NULL,                        -- links to authors table (future)
  title         VARCHAR(255) NOT NULL,
  nepali_title  VARCHAR(255) NULL,
  description   TEXT NULL,
  category      VARCHAR(100) NULL,
  language      VARCHAR(50) DEFAULT 'Nepali',
  keywords      VARCHAR(500) NULL,
  buy_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  rent_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
  rent_days     INT NOT NULL DEFAULT 15,
  cover_image   VARCHAR(500) NULL,                   -- relative path: uploads/covers/filename.jpg
  pdf_file      VARCHAR(500) NULL,                   -- relative path: uploads/pdfs/filename.pdf
  status        ENUM('draft','published') DEFAULT 'draft',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
