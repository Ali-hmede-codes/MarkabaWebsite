-- Create settings table for admin panel configuration
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` longtext,
  `setting_type` enum('string','number','boolean','json','text') DEFAULT 'string',
  `description` text,
  `category` varchar(100) DEFAULT 'general',
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_category` (`category`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `category`, `is_public`) VALUES
-- General settings
('general_site_name', 'نيوز مركبة', 'string', 'اسم الموقع', 'general', 1),
('general_site_description', 'موقع إخباري شامل', 'string', 'وصف الموقع', 'general', 1),
('general_site_url', 'https://markaba.news', 'string', 'رابط الموقع', 'general', 1),
('general_admin_email', 'admin@markaba.news', 'string', 'بريد المدير الإلكتروني', 'general', 0),
('general_timezone', 'Asia/Riyadh', 'string', 'المنطقة الزمنية', 'general', 0),
('general_language', 'ar', 'string', 'لغة الموقع الافتراضية', 'general', 1),
('general_posts_per_page', '10', 'number', 'عدد المقالات في الصفحة', 'general', 1),
('general_maintenance_mode', 'false', 'boolean', 'وضع الصيانة', 'general', 0),
('general_registration_enabled', 'false', 'boolean', 'السماح بالتسجيل', 'general', 0),
('general_comments_enabled', 'true', 'boolean', 'السماح بالتعليقات', 'general', 1),

-- SEO settings
('seo_meta_title', 'نيوز مركبة - آخر الأخبار', 'string', 'عنوان الصفحة الرئيسية', 'seo', 1),
('seo_meta_description', 'موقع نيوز مركبة للأخبار العاجلة والتقارير الشاملة', 'string', 'وصف الصفحة الرئيسية', 'seo', 1),
('seo_meta_keywords', 'أخبار, عاجل, تقارير, نيوز مركبة', 'string', 'الكلمات المفتاحية', 'seo', 1),
('seo_google_analytics', '', 'string', 'معرف Google Analytics', 'seo', 0),
('seo_google_search_console', '', 'string', 'معرف Google Search Console', 'seo', 0),
('seo_facebook_pixel', '', 'string', 'معرف Facebook Pixel', 'seo', 0),
('seo_robots_txt', 'User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: /sitemap.xml', 'text', 'محتوى ملف robots.txt', 'seo', 1),

-- Social media settings
('social_facebook', '', 'string', 'رابط صفحة Facebook', 'social', 1),
('social_twitter', '', 'string', 'رابط حساب Twitter', 'social', 1),
('social_instagram', '', 'string', 'رابط حساب Instagram', 'social', 1),
('social_youtube', '', 'string', 'رابط قناة YouTube', 'social', 1),
('social_linkedin', '', 'string', 'رابط صفحة LinkedIn', 'social', 1),
('social_telegram', '', 'string', 'رابط قناة Telegram', 'social', 1),
('social_whatsapp', '', 'string', 'رقم WhatsApp', 'social', 1),

-- Email settings
('email_host', '', 'string', 'خادم البريد الإلكتروني', 'email', 0),
('email_port', '587', 'number', 'منفذ البريد الإلكتروني', 'email', 0),
('email_secure', 'false', 'boolean', 'استخدام SSL/TLS', 'email', 0),
('email_username', '', 'string', 'اسم المستخدم للبريد', 'email', 0),
('email_password', '', 'string', 'كلمة مرور البريد', 'email', 0),
('email_from_name', 'نيوز مركبة', 'string', 'اسم المرسل', 'email', 0),
('email_from_email', '', 'string', 'بريد المرسل', 'email', 0),

-- Content settings
('content_allow_comments', 'true', 'boolean', 'السماح بالتعليقات', 'content', 1),
('content_moderate_comments', 'true', 'boolean', 'مراجعة التعليقات قبل النشر', 'content', 0),
('content_max_upload_size', '5', 'number', 'الحد الأقصى لحجم الملف (MB)', 'content', 0),
('content_allowed_file_types', 'jpg,jpeg,png,gif,webp,pdf,doc,docx', 'string', 'أنواع الملفات المسموحة', 'content', 0),
('content_image_quality', '85', 'number', 'جودة الصور المضغوطة', 'content', 0),
('content_auto_save_interval', '30', 'number', 'فترة الحفظ التلقائي (ثانية)', 'content', 0),

-- Media settings
('media_upload_path', '/uploads', 'string', 'مسار رفع الملفات', 'media', 0),
('media_thumbnail_width', '300', 'number', 'عرض الصورة المصغرة', 'media', 0),
('media_thumbnail_height', '200', 'number', 'ارتفاع الصورة المصغرة', 'media', 0),
('media_watermark_enabled', 'false', 'boolean', 'تفعيل العلامة المائية', 'media', 0),
('media_watermark_text', 'نيوز مركبة', 'string', 'نص العلامة المائية', 'media', 0),

-- Security settings
('security_max_login_attempts', '5', 'number', 'الحد الأقصى لمحاولات تسجيل الدخول', 'security', 0),
('security_lockout_duration', '15', 'number', 'مدة الحظر (دقيقة)', 'security', 0),
('security_session_timeout', '1440', 'number', 'انتهاء الجلسة (دقيقة)', 'security', 0),
('security_force_https', 'true', 'boolean', 'إجبار استخدام HTTPS', 'security', 0),
('security_two_factor_enabled', 'false', 'boolean', 'تفعيل المصادقة الثنائية', 'security', 0),
('security_password_min_length', '8', 'number', 'الحد الأدنى لطول كلمة المرور', 'security', 0),

-- Performance settings
('performance_cache_enabled', 'true', 'boolean', 'تفعيل التخزين المؤقت', 'performance', 0),
('performance_cache_duration', '3600', 'number', 'مدة التخزين المؤقت (ثانية)', 'performance', 0),
('performance_compression_enabled', 'true', 'boolean', 'تفعيل ضغط المحتوى', 'performance', 0),
('performance_minify_css', 'true', 'boolean', 'ضغط ملفات CSS', 'performance', 0),
('performance_minify_js', 'true', 'boolean', 'ضغط ملفات JavaScript', 'performance', 0),

-- Advanced settings
('advanced_debug_mode', 'false', 'boolean', 'وضع التطوير', 'advanced', 0),
('advanced_api_rate_limit', '100', 'number', 'حد معدل API (طلب/دقيقة)', 'advanced', 0),
('advanced_backup_enabled', 'true', 'boolean', 'تفعيل النسخ الاحتياطي', 'advanced', 0),
('advanced_backup_frequency', 'daily', 'string', 'تكرار النسخ الاحتياطي', 'advanced', 0),
('advanced_log_level', 'info', 'string', 'مستوى السجلات', 'advanced', 0),

-- Notification settings
('notification_email_enabled', 'true', 'boolean', 'تفعيل إشعارات البريد', 'notification', 0),
('notification_new_post', 'true', 'boolean', 'إشعار المقالات الجديدة', 'notification', 0),
('notification_new_comment', 'true', 'boolean', 'إشعار التعليقات الجديدة', 'notification', 0),
('notification_new_user', 'true', 'boolean', 'إشعار المستخدمين الجدد', 'notification', 0),

-- Theme settings
('theme_primary_color', '#1e40af', 'string', 'اللون الأساسي', 'theme', 1),
('theme_secondary_color', '#64748b', 'string', 'اللون الثانوي', 'theme', 1),
('theme_accent_color', '#f59e0b', 'string', 'لون التمييز', 'theme', 1),
('theme_font_family', 'Cairo, sans-serif', 'string', 'خط النص', 'theme', 1),
('theme_logo_url', '/images/logo.png', 'string', 'رابط الشعار', 'theme', 1),
('theme_favicon_url', '/images/favicon.ico', 'string', 'رابط الأيقونة المفضلة', 'theme', 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_settings_category_public` ON `settings` (`category`, `is_public`);
CREATE INDEX IF NOT EXISTS `idx_settings_key_type` ON `settings` (`setting_key`, `setting_type`);

-- Add some sample data for testing
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `category`) VALUES
('test_string_setting', 'Test Value', 'string', 'A test string setting', 'test'),
('test_number_setting', '42', 'number', 'A test number setting', 'test'),
('test_boolean_setting', 'true', 'boolean', 'A test boolean setting', 'test'),
('test_json_setting', '{"key": "value", "number": 123}', 'json', 'A test JSON setting', 'test');