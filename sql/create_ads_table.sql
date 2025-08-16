-- Create ads table for custom ads system
CREATE TABLE IF NOT EXISTS ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_path VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  position ENUM('main_top', 'main_middle', 'main_bottom', 'post_square', 'post_banner') NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NOT NULL,
  clicks INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_position (position),
  INDEX idx_active_end_date (is_active, end_date),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create ads_positions table for position management
CREATE TABLE IF NOT EXISTS ads_positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  position_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  max_ads INT DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default ad positions
INSERT INTO ads_positions (position_name, display_name, width, height, max_ads, description) VALUES
('main_top', 'Main Page - Top Banner', 1280, 300, 1, 'Top banner on main page'),
('main_middle', 'Main Page - Middle Banner', 1280, 300, 1, 'Middle banner on main page'),
('main_bottom', 'Main Page - Bottom Banner', 1280, 300, 1, 'Bottom banner on main page'),
('post_square', 'Post Page - Square Ad', 300, 300, 1, 'Square ad on post pages'),
('post_banner', 'Post Page - Banner Ad', 1280, 300, 1, 'Banner ad on post pages');

-- Create ads_clicks table for tracking
CREATE TABLE IF NOT EXISTS ads_clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ad_id (ad_id),
  INDEX idx_clicked_at (clicked_at),
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);