-- News Site Database Schema (Arabic-Only)
-- Optimized structure based on update_to_arabic_only.sql requirements

CREATE DATABASE IF NOT EXISTS news_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE news_site;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar VARCHAR(255),
  bio TEXT,
  role ENUM('admin', 'author', 'editor') DEFAULT 'author',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
);

-- Categories (Arabic only)
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description_ar TEXT,
  color VARCHAR(7) DEFAULT '#007bff',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active (is_active),
  INDEX idx_sort_order (sort_order)
);

-- Posts (Arabic only)
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title_ar VARCHAR(255) NOT NULL,
  content_ar TEXT NOT NULL,
  excerpt_ar TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id INT,
  author_id INT NOT NULL,
  featured_image VARCHAR(255),
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  reading_time INT DEFAULT 1,
  tags JSON,
  meta_description_ar TEXT,
  meta_keywords_ar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_author (author_id),
  INDEX idx_published (is_published),
  INDEX idx_featured (is_featured),
  INDEX idx_created (created_at)
);

-- Breaking news (Arabic only)
CREATE TABLE breaking_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_ar VARCHAR(255) NOT NULL,
  content_ar TEXT,
  slug VARCHAR(255) UNIQUE,
  link VARCHAR(255),
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_priority (priority),
  INDEX idx_slug (slug)
);

-- Site settings (Arabic only)
CREATE TABLE site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value_ar TEXT NOT NULL,
  setting_type ENUM('text', 'textarea', 'number', 'boolean', 'image') DEFAULT 'text',
  category VARCHAR(50) DEFAULT 'general',
  description VARCHAR(255),
  is_editable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Media table
CREATE TABLE media (
  id INT PRIMARY KEY AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  type ENUM('general', 'post', 'avatar', 'thumbnail', 'document') DEFAULT 'general',
  alt_text TEXT,
  caption TEXT,
  uploaded_by INT NOT NULL,
  thumbnails JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Default data
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@newsmarkaba.com', '$2a$12$1IugvgKB8jfwxISuBIn5MOcjPrAr7/8g6ZQMnc0wKWODLg3tVP6J.', 'admin');

INSERT INTO categories (name_ar, slug, description_ar) VALUES 
('سياسة', 'politics', 'أخبار سياسية محلية وعالمية'),
('رياضة', 'sports', 'أخبار رياضية ومباريات'),
('تكنولوجيا', 'technology', 'أحدث التطورات التقنية'),
('صحة', 'health', 'أخبار طبية ونصائح صحية'),
('اقتصاد', 'economy', 'أخبار اقتصادية ومالية'),
('ثقافة', 'culture', 'أخبار ثقافية وفنية');

INSERT INTO site_settings (setting_key, setting_value_ar, setting_type, category) VALUES 
('site_name', 'نيوز مركبة', 'text', 'general'),
('site_tagline', 'مصدرك الموثوق للأخبار', 'text', 'general'),
('site_description', 'ابق على اطلاع بآخر الأخبار والتحديثات', 'textarea', 'general');

INSERT INTO breaking_news (title_ar, content_ar, slug, link, priority, is_active) VALUES 
('مرحباً بكم في موقعنا الإخباري!', 'ابقوا على اطلاع بآخر الأخبار والتحديثات', 'welcome-news', '/', 1, TRUE);

SELECT 'Database created successfully!' as message;