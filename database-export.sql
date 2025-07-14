-- =====================================================
-- Database Update Script for markabadatabase
-- Generated on: 2025-07-14T08:52:19.966Z
-- =====================================================

USE `markabadatabase`;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Update site_settings table structure
-- =====================================================

-- Update existing site_settings data
UPDATE `site_settings` SET `setting_value` = `setting_value_ar` WHERE `setting_value` IS NULL;
UPDATE `site_settings` SET `data_type` = 'string' WHERE `data_type` IS NULL;
UPDATE `site_settings` SET `is_public` = 1 WHERE `setting_key` IN ('site_name', 'site_tagline', 'site_description', 'site_logo');

-- =====================================================
-- Optimize settings table indexes
-- =====================================================
-- Add indexes for better performance (ignore if exists)
ALTER TABLE `settings` ADD INDEX `idx_settings_category_public` (`category`, `is_public`);
ALTER TABLE `settings` ADD INDEX `idx_settings_key_type` (`setting_key`, `setting_type`);

-- =====================================================
-- Enhance users table security
-- =====================================================

-- =====================================================
-- Enhance posts table for SEO
-- =====================================================
ALTER TABLE `posts` ADD COLUMN `meta_title` varchar(255) DEFAULT NULL;
ALTER TABLE `posts` ADD COLUMN `meta_description` text DEFAULT NULL;
ALTER TABLE `posts` ADD COLUMN `meta_keywords` text DEFAULT NULL;

-- =====================================================
-- Performance optimizations
-- =====================================================
-- Optimize table engines and character sets
ALTER TABLE `breaking_news` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `categories` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `media` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `posts` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `settings` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `site_settings` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `social_media` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `users` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Final cleanup and optimization
-- =====================================================
SET FOREIGN_KEY_CHECKS = 1;

-- Analyze tables for optimization
ANALYZE TABLE `breaking_news`;
ANALYZE TABLE `categories`;
ANALYZE TABLE `media`;
ANALYZE TABLE `posts`;
ANALYZE TABLE `settings`;
ANALYZE TABLE `site_settings`;
ANALYZE TABLE `social_media`;
ANALYZE TABLE `users`;

-- Update script completed successfully
-- Total tables processed: 8
