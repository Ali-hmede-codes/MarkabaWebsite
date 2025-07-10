const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function addLogoSetting() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'news_site',
      charset: 'utf8mb4'
    });

    console.log('Connected to MySQL database');

    // Check if logo setting already exists
    const [existing] = await connection.execute(
      'SELECT * FROM site_settings WHERE setting_key = ?',
      ['site_logo']
    );

    if (existing.length > 0) {
      console.log('Logo setting already exists, updating...');
      await connection.execute(
        'UPDATE site_settings SET setting_value_ar = ?, setting_type = ?, description = ? WHERE setting_key = ?',
        ['/images/logo.png', 'image', 'شعار الموقع الرئيسي', 'site_logo']
      );
    } else {
      console.log('Adding new logo setting...');
      await connection.execute(
        'INSERT INTO site_settings (setting_key, setting_value_ar, setting_type, category, description) VALUES (?, ?, ?, ?, ?)',
        ['site_logo', '/images/logo.png', 'image', 'general', 'شعار الموقع الرئيسي']
      );
    }

    console.log('✅ Logo setting added/updated successfully!');
    
    // Verify the setting was added
    const [result] = await connection.execute(
      'SELECT * FROM site_settings WHERE setting_key = ?',
      ['site_logo']
    );
    
    console.log('Current logo setting:', result[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

addLogoSetting();