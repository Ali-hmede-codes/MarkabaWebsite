-- Add social media table to the database
USE news_site;

-- Social media links table
CREATE TABLE social_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#000000',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_platform (platform),
  INDEX idx_active (is_active),
  INDEX idx_sort_order (sort_order)
);

-- Insert default social media platforms
INSERT INTO social_media (platform, name_ar, url, icon, color, sort_order, is_active) VALUES 
('facebook', 'فيسبوك', 'https://facebook.com/newsmarkaba', 'FiFacebook', '#1877F2', 1, TRUE),
('twitter', 'تويتر', 'https://twitter.com/newsmarkaba', 'FiTwitter', '#1DA1F2', 2, TRUE),
('instagram', 'إنستغرام', 'https://instagram.com/newsmarkaba', 'FiInstagram', '#E4405F', 3, TRUE),
('youtube', 'يوتيوب', 'https://youtube.com/newsmarkaba', 'FiYoutube', '#FF0000', 4, TRUE),
('linkedin', 'لينكد إن', 'https://linkedin.com/company/newsmarkaba', 'FiLinkedin', '#0A66C2', 5, FALSE),
('telegram', 'تليغرام', 'https://t.me/newsmarkaba', 'FiSend', '#0088CC', 6, FALSE),
('whatsapp', 'واتساب', 'https://wa.me/newsmarkaba', 'FiMessageCircle', '#25D366', 7, FALSE);

SELECT 'Social media table created successfully!' as message;