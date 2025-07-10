const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateLogoSetting() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'news_site',
      charset: 'utf8mb4'
    });

    console.log('Connected to MySQL database');

    await connection.execute(
      'UPDATE site_settings SET setting_value_ar = ? WHERE setting_key = ?',
      ['/images/logo.svg', 'site_logo']
    );

    console.log('✅ Logo setting updated to SVG!');
    
    // Verify the update
    const [result] = await connection.execute(
      'SELECT * FROM site_settings WHERE setting_key = ?',
      ['site_logo']
    );
    
    console.log('Updated logo setting:', result[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateLogoSetting();