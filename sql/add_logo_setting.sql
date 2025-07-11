-- Add logo setting to site_settings table
USE markabadatabase;

INSERT INTO site_settings (setting_key, setting_value_ar, setting_type, category, description) 
VALUES ('site_logo', '/images/logo.png', 'image', 'general', 'شعار الموقع الرئيسي');

SELECT 'Logo setting added successfully!' as message;