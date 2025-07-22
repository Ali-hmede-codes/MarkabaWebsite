const { query } = require('../db.cjs');

async function runMigration() {
  try {
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) NULL,
      ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP NULL;
    `);

    await query(`
      ALTER TABLE users
      ADD INDEX IF NOT EXISTS idx_refresh_token (refresh_token);
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();