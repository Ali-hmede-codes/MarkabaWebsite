-- SQL script to update existing database to Arabic-only structure
-- Run this script to remove English columns and update existing data

USE markabadatabase;

-- Update categories table - remove English columns
ALTER TABLE categories 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS description;

-- Update posts table - remove English columns
ALTER TABLE posts 
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS content,
DROP COLUMN IF EXISTS excerpt,
DROP COLUMN IF EXISTS meta_description,
DROP COLUMN IF EXISTS meta_keywords;

-- Update breaking_news table - remove English columns
ALTER TABLE breaking_news 
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS content;

-- Update site_settings table - remove English column
ALTER TABLE site_settings 
DROP COLUMN IF EXISTS setting_value;

-- Add missing columns if they don't exist
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#007bff',
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE breaking_news 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_breaking_news_slug ON breaking_news(slug);
CREATE INDEX IF NOT EXISTS idx_breaking_news_active ON breaking_news(is_active);

-- Update existing data to ensure Arabic content is present
-- This is a safety measure - you may need to customize based on your existing data

-- For categories without Arabic names, copy from English if exists
UPDATE categories 
SET name_ar = COALESCE(name_ar, 'فئة غير مسماة')
WHERE name_ar IS NULL OR name_ar = '';

-- For posts without Arabic titles, mark them for review
UPDATE posts 
SET title_ar = COALESCE(title_ar, 'مقال بحاجة لترجمة')
WHERE title_ar IS NULL OR title_ar = '';

-- For posts without Arabic content, mark them for review
UPDATE posts 
SET content_ar = COALESCE(content_ar, 'محتوى بحاجة لترجمة')
WHERE content_ar IS NULL OR content_ar = '';

-- For breaking news without Arabic titles, mark them for review
UPDATE breaking_news 
SET title_ar = COALESCE(title_ar, 'خبر عاجل بحاجة لترجمة')
WHERE title_ar IS NULL OR title_ar = '';

-- For breaking news without Arabic content, mark them for review
UPDATE breaking_news 
SET content_ar = COALESCE(content_ar, 'محتوى بحاجة لترجمة')
WHERE content_ar IS NULL OR content_ar = '';

-- Generate slugs for breaking news if missing
UPDATE breaking_news 
SET slug = CONCAT('breaking-news-', id)
WHERE slug IS NULL OR slug = '';

-- Update site settings to use only Arabic values
UPDATE site_settings 
SET setting_value_ar = COALESCE(setting_value_ar, 'قيمة بحاجة لترجمة')
WHERE setting_value_ar IS NULL OR setting_value_ar = '';

SELECT 'Database updated to Arabic-only structure successfully!' as message;