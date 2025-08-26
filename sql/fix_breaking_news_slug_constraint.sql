-- Fix breaking news slug constraint to allow duplicate titles
-- This removes the UNIQUE constraint from the slug column in breaking_news table

USE markaba_news;

-- First, let's check if the constraint exists
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'markaba_news' 
AND TABLE_NAME = 'breaking_news' 
AND CONSTRAINT_TYPE = 'UNIQUE';

-- Drop the unique constraint on slug column
-- Note: MySQL automatically creates a constraint name, we need to find it first
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'markaba_news' 
    AND TABLE_NAME = 'breaking_news' 
    AND COLUMN_NAME = 'slug'
    AND CONSTRAINT_NAME != 'PRIMARY'
);

-- Drop the unique constraint if it exists
SET @sql = CONCAT('ALTER TABLE breaking_news DROP INDEX ', @constraint_name);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Keep the regular index for performance but remove uniqueness
CREATE INDEX IF NOT EXISTS idx_breaking_news_slug ON breaking_news(slug);

-- Verify the change
SHOW INDEX FROM breaking_news WHERE Column_name = 'slug';

SELECT 'Breaking news slug constraint removed successfully. Duplicate titles are now allowed.' as status;