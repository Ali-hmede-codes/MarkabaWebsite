const { query } = require('./server/db');

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Add missing columns to users table
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until DATETIME NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255) NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires DATETIME NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login DATETIME NULL'
    ];
    
    for (const alterQuery of alterQueries) {
      try {
        await query(alterQuery);
        console.log(`✅ Executed: ${alterQuery}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Column already exists: ${alterQuery}`);
        } else {
          console.error(`❌ Error executing: ${alterQuery}`, error.message);
        }
      }
    }
    
    console.log('✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  }
}

fixDatabaseSchema().then(() => {
  console.log('🎉 Database schema fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});