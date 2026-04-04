CREATE TABLE IF NOT EXISTS author_notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  author_id       INT NOT NULL,
  book_id         INT NULL,
  type            ENUM('purchase', 'rent', 'review', 'favorite') NOT NULL,
  message         VARCHAR(500) NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_notif_author ON author_notifications(author_id, is_read);
