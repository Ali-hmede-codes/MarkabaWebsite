-- Create ads system tables
-- Custom ad system with positions and automatic expiration

USE markabadatabase;

-- Ad positions table (to easily manage different ad positions)
CREATE TABLE IF NOT EXISTS ad_positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  name_ar VARCHAR(100) NOT NULL,
  description TEXT,
  width INT NOT NULL,
  height INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  position_id INT NOT NULL,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expire_date DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  clicks INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES ad_positions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_position (position_id),
  INDEX idx_active (is_active),
  INDEX idx_expire_date (expire_date),
  INDEX idx_start_date (start_date),
  INDEX idx_created_by (created_by),
  UNIQUE KEY unique_active_position (position_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default ad positions
INSERT INTO ad_positions (name, name_ar, description, width, height) VALUES 
('main_top', 'أعلى الصفحة الرئيسية', 'إعلان في أعلى الصفحة الرئيسية', 1280, 300),
('middle_main', 'وسط الصفحة الرئيسية', 'إعلان في وسط الصفحة الرئيسية', 1280, 300),
('bottom_main', 'أسفل الصفحة الرئيسية', 'إعلان في أسفل الصفحة الرئيسية', 1280, 300),
('post_bottom', 'أسفل المقال', 'إعلان في أسفل صفحة المقال', 1280, 300),
('square_post_middle', 'مربع وسط المقال', 'إعلان مربع في وسط المقال', 300, 300);

-- Create inactive ads table for expired ads history
CREATE TABLE IF NOT EXISTS ads_inactive (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_ad_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  image_path VARCHAR(500),
  link_url VARCHAR(500) NOT NULL,
  position_name VARCHAR(100) NOT NULL,
  start_date DATETIME,
  expire_date DATETIME,
  total_clicks INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP,
  expired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_original_ad (original_ad_id),
  INDEX idx_position_name (position_name),
  INDEX idx_expired_at (expired_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Ads system tables created successfully!' as message;