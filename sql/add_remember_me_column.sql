-- Add remember_me column to users table
ALTER TABLE users ADD COLUMN remember_me BOOLEAN DEFAULT FALSE;

-- Update the column to be NOT NULL with default value
UPDATE users SET remember_me = FALSE WHERE remember_me IS NULL;
ALTER TABLE users MODIFY COLUMN remember_me BOOLEAN NOT NULL DEFAULT FALSE;

SELECT 'Remember me column added successfully!' as message;