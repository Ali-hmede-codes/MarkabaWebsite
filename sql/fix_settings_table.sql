-- Fix site_settings table to match enhanced settings route expectations
USE news_site;

-- Add missing columns to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS setting_value TEXT,
ADD COLUMN IF NOT EXISTS data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Copy Arabic values to the new setting_value column
UPDATE site_settings 
SET setting_value = setting_value_ar
WHERE setting_value IS NULL;

-- Update data types for existing settings
UPDATE site_settings SET data_type = 'string' WHERE setting_type IN ('text', 'textarea', 'image');
UPDATE site_settings SET data_type = 'number' WHERE setting_type = 'number';
UPDATE site_settings SET data_type = 'boolean' WHERE setting_type = 'boolean';

-- Set some settings as public
UPDATE site_settings SET is_public = TRUE WHERE setting_key IN ('site_name', 'site_tagline', 'site_description', 'site_logo');

SELECT 'Site settings table fixed successfully!' as message;