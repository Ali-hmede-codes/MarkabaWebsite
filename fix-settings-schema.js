const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSettingsSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'news_site',
    charset: 'utf8mb4'
  });

  try {
    console.log('Fixing site_settings table schema...');

    // Add missing columns
    await connection.execute(`
      ALTER TABLE site_settings 
      ADD COLUMN IF NOT EXISTS setting_value TEXT,
      ADD COLUMN IF NOT EXISTS data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
      ADD COLUMN IF NOT EXISTS description_ar TEXT,
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added missing columns');

    // Copy Arabic values to the new setting_value column
    await connection.execute(`
      UPDATE site_settings 
      SET setting_value = setting_value_ar
      WHERE setting_value IS NULL
    `);
    console.log('✓ Copied Arabic values to setting_value column');

    // Update data types for existing settings
    await connection.execute(`
      UPDATE site_settings SET data_type = 'string' WHERE setting_type IN ('text', 'textarea', 'image')
    `);
    await connection.execute(`
      UPDATE site_settings SET data_type = 'number' WHERE setting_type = 'number'
    `);
    await connection.execute(`
      UPDATE site_settings SET data_type = 'boolean' WHERE setting_type = 'boolean'
    `);
    console.log('✓ Updated data types');

    // Set some settings as public
    await connection.execute(`
      UPDATE site_settings SET is_public = TRUE 
      WHERE setting_key IN ('site_name', 'site_tagline', 'site_description', 'site_logo')
    `);
    console.log('✓ Set public settings');

    console.log('\n🎉 Site settings table fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing settings schema:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixSettingsSchema();