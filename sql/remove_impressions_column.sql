-- Remove impressions column from ads table
-- This migration removes the impressions tracking from existing ads table

-- Check if impressions column exists and remove it (MySQL compatible syntax)
SET @sql = (
    SELECT IF(
        COUNT(*) > 0,
        'ALTER TABLE ads DROP COLUMN impressions;',
        'SELECT "Column impressions does not exist" as message;'
    )
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'ads' 
    AND COLUMN_NAME = 'impressions'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop ads_impressions table if it exists
DROP TABLE IF EXISTS ads_impressions;

-- Update any existing procedures or views that might reference impressions
-- (Add specific DROP statements here if you have any stored procedures or views)

-- Verification query to check the table structure after migration
-- DESCRIBE ads;