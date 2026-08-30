-- =============================================================================
-- News Markaba — full MySQL schema (one-file install)
-- Merges create_tables + last_news + ads + social + auth + settings + posts extras
-- Fresh install only. Do not run on a database that already has these tables.
--
-- Usage:
--   mysql -u root -p < sql/schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS markabadatabase
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE markabadatabase;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
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
  failed_login_attempts INT DEFAULT 0,
  lockout_until TIMESTAMP NULL,
  last_login_ip VARCHAR(45) NULL,
  refresh_token VARCHAR(255) NULL,
  refresh_token_expires TIMESTAMP NULL,
  remember_me BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active),
  INDEX idx_refresh_token (refresh_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Categories (Arabic only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Posts (Arabic only + video + SEO)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title_ar VARCHAR(255) NOT NULL,
  content_ar TEXT NOT NULL,
  excerpt_ar TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id INT,
  author_id INT NOT NULL,
  featured_image VARCHAR(255),
  video_link VARCHAR(500) NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  reading_time INT DEFAULT 1,
  tags JSON,
  meta_title VARCHAR(255) DEFAULT NULL,
  meta_description_ar TEXT,
  meta_description TEXT DEFAULT NULL,
  meta_keywords_ar TEXT,
  meta_keywords TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_author (author_id),
  INDEX idx_published (is_published),
  INDEX idx_featured (is_featured),
  INDEX idx_created (created_at),
  INDEX idx_video_link (video_link)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Breaking news (slug is indexed, not unique — duplicate titles allowed)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS breaking_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_ar VARCHAR(255) NOT NULL,
  content_ar TEXT,
  slug VARCHAR(255),
  link VARCHAR(255),
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_priority (priority),
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Last news
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS last_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_ar VARCHAR(255) NOT NULL,
  content_ar TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  priority INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Site settings (public site copy)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value_ar TEXT NOT NULL,
  setting_value TEXT,
  setting_type ENUM('text', 'textarea', 'number', 'boolean', 'image') DEFAULT 'text',
  data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'general',
  description VARCHAR(255),
  description_ar TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Admin settings (panel configuration)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id INT NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(255) NOT NULL,
  setting_value LONGTEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json', 'text') DEFAULT 'string',
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_public TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY setting_key (setting_key),
  KEY idx_category (category),
  KEY idx_is_public (is_public),
  KEY idx_settings_category_public (category, is_public),
  KEY idx_settings_key_type (setting_key, setting_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Media
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Social media
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_media (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Ads
-- -----------------------------------------------------------------------------
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
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Seed data
-- =============================================================================

INSERT IGNORE INTO users (username, email, password, role) VALUES
('admin', 'admin@markaba.news', '$2a$12$1IugvgKB8jfwxISuBIn5MOcjPrAr7/8g6ZQMnc0wKWODLg3tVP6J.', 'admin');

INSERT IGNORE INTO categories (name_ar, slug, description_ar) VALUES
('سياسة', 'politics', 'أخبار سياسية محلية وعالمية'),
('رياضة', 'sports', 'أخبار رياضية ومباريات'),
('تكنولوجيا', 'technology', 'أحدث التطورات التقنية'),
('صحة', 'health', 'أخبار طبية ونصائح صحية'),
('اقتصاد', 'economy', 'أخبار اقتصادية ومالية'),
('ثقافة', 'culture', 'أخبار ثقافية وفنية');

INSERT IGNORE INTO site_settings (setting_key, setting_value_ar, setting_value, setting_type, data_type, category, description, is_public) VALUES
('site_name', 'نيوز مركبا', 'نيوز مركبا', 'text', 'string', 'general', 'اسم الموقع', TRUE),
('site_tagline', 'مصدرك الموثوق للأخبار', 'مصدرك الموثوق للأخبار', 'text', 'string', 'general', 'شعار الموقع', TRUE),
('site_description', 'ابق على اطلاع بآخر الأخبار والتحديثات', 'ابق على اطلاع بآخر الأخبار والتحديثات', 'textarea', 'string', 'general', 'وصف الموقع', TRUE),
('site_logo', '/images/logo.png', '/images/logo.png', 'image', 'string', 'general', 'شعار الموقع الرئيسي', TRUE);

INSERT IGNORE INTO breaking_news (title_ar, content_ar, slug, link, priority, is_active) VALUES
('مرحباً بكم في موقعنا الإخباري!', 'ابقوا على اطلاع بآخر الأخبار والتحديثات', 'welcome-news', '/', 1, TRUE);

INSERT IGNORE INTO last_news (title_ar, content_ar, slug, priority) VALUES
('عنوان خبر أخير 1', 'محتوى الخبر الأخير الأول.', 'last-news-1', 1),
('عنوان خبر أخير 2', 'محتوى الخبر الأخير الثاني.', 'last-news-2', 2),
('عنوان خبر أخير 3', 'محتوى الخبر الأخير الثالث.', 'last-news-3', 3);

INSERT IGNORE INTO social_media (platform, name_ar, url, icon, color, sort_order, is_active) VALUES
('facebook', 'فيسبوك', 'https://facebook.com/newsmarkaba', 'FiFacebook', '#1877F2', 1, TRUE),
('twitter', 'تويتر', 'https://twitter.com/newsmarkaba', 'FiTwitter', '#1DA1F2', 2, TRUE),
('instagram', 'إنستغرام', 'https://instagram.com/newsmarkaba', 'FiInstagram', '#E4405F', 3, TRUE),
('youtube', 'يوتيوب', 'https://youtube.com/newsmarkaba', 'FiYoutube', '#FF0000', 4, TRUE),
('linkedin', 'لينكد إن', 'https://linkedin.com/company/newsmarkaba', 'FiLinkedin', '#0A66C2', 5, FALSE),
('telegram', 'تليغرام', 'https://t.me/newsmarkaba', 'FiSend', '#0088CC', 6, FALSE),
('whatsapp', 'واتساب', 'https://wa.me/newsmarkaba', 'FiMessageCircle', '#25D366', 7, FALSE);

INSERT IGNORE INTO ad_positions (name, name_ar, description, width, height) VALUES
('main_top', 'أعلى الصفحة الرئيسية', 'إعلان في أعلى الصفحة الرئيسية', 1280, 300),
('middle_main', 'وسط الصفحة الرئيسية', 'إعلان في وسط الصفحة الرئيسية', 1280, 300),
('bottom_main', 'أسفل الصفحة الرئيسية', 'إعلان في أسفل الصفحة الرئيسية', 1280, 300),
('post_bottom', 'أسفل المقال', 'إعلان في أسفل صفحة المقال', 1280, 300),
('square_post_middle', 'مربع وسط المقال', 'إعلان مربع في وسط المقال', 300, 300);

INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
('general_site_name', 'نيوز مركبا', 'string', 'اسم الموقع', 'general', 1),
('general_site_description', 'موقع إخباري شامل', 'string', 'وصف الموقع', 'general', 1),
('general_site_url', 'https://markaba.news', 'string', 'رابط الموقع', 'general', 1),
('general_admin_email', 'admin@markaba.news', 'string', 'بريد المدير الإلكتروني', 'general', 0),
('general_timezone', 'Asia/Beirut', 'string', 'المنطقة الزمنية', 'general', 0),
('general_language', 'ar', 'string', 'لغة الموقع الافتراضية', 'general', 1),
('general_posts_per_page', '10', 'number', 'عدد المقالات في الصفحة', 'general', 1),
('general_maintenance_mode', 'false', 'boolean', 'وضع الصيانة', 'general', 0),
('general_registration_enabled', 'false', 'boolean', 'السماح بالتسجيل', 'general', 0),
('general_comments_enabled', 'true', 'boolean', 'السماح بالتعليقات', 'general', 1),
('seo_meta_title', 'نيوز مركبا - آخر الأخبار', 'string', 'عنوان الصفحة الرئيسية', 'seo', 1),
('seo_meta_description', 'موقع نيوز مركبا للأخبار العاجلة والتقارير الشاملة', 'string', 'وصف الصفحة الرئيسية', 'seo', 1),
('seo_meta_keywords', 'أخبار, عاجل, تقارير, نيوز مركبا', 'string', 'الكلمات المفتاحية', 'seo', 1),
('seo_google_analytics', '', 'string', 'معرف Google Analytics', 'seo', 0),
('seo_google_search_console', '', 'string', 'معرف Google Search Console', 'seo', 0),
('seo_facebook_pixel', '', 'string', 'معرف Facebook Pixel', 'seo', 0),
('social_facebook', '', 'string', 'رابط صفحة Facebook', 'social', 1),
('social_twitter', '', 'string', 'رابط حساب Twitter', 'social', 1),
('social_instagram', '', 'string', 'رابط حساب Instagram', 'social', 1),
('social_youtube', '', 'string', 'رابط قناة YouTube', 'social', 1),
('email_host', '', 'string', 'خادم البريد الإلكتروني', 'email', 0),
('email_port', '587', 'number', 'منفذ البريد الإلكتروني', 'email', 0),
('email_secure', 'false', 'boolean', 'استخدام SSL/TLS', 'email', 0),
('email_username', '', 'string', 'اسم المستخدم للبريد', 'email', 0),
('email_password', '', 'string', 'كلمة مرور البريد', 'email', 0),
('email_from_name', 'نيوز مركبا', 'string', 'اسم المرسل', 'email', 0),
('email_from_email', '', 'string', 'بريد المرسل', 'email', 0),
('content_max_upload_size', '5', 'number', 'الحد الأقصى لحجم الملف (MB)', 'content', 0),
('security_max_login_attempts', '5', 'number', 'الحد الأقصى لمحاولات تسجيل الدخول', 'security', 0),
('security_lockout_duration', '15', 'number', 'مدة الحظر (دقيقة)', 'security', 0),
('theme_primary_color', '#1e40af', 'string', 'اللون الأساسي', 'theme', 1),
('theme_logo_url', '/images/logo.png', 'string', 'رابط الشعار', 'theme', 1);

SELECT 'markabadatabase schema installed successfully' AS message;
