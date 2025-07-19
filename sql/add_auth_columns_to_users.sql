-- Add missing authentication columns to users table
ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN lockout_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(45) NULL;
ALTER TABLE users ADD COLUMN refresh_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN refresh_token_expires TIMESTAMP NULL;

-- Update indexes if needed
ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_refresh_token (refresh_token);

SELECT 'Authentication columns added successfully!' as message;