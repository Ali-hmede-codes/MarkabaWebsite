-- Add missing authentication columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) NULL,
ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP NULL;

-- Update indexes if needed
ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_refresh_token (refresh_token);

SELECT 'Authentication columns added successfully!' as message;