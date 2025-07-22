require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4'
};

async function generateUpdateSQL() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Get current database structure
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    console.log(`Found ${tables.length} tables in database`);
    
    // Start building the update SQL
    let updateSQL = `-- =====================================================\n`;
    updateSQL += `-- Database Update Script for ${dbConfig.database}\n`;
    updateSQL += `-- Generated on: ${new Date().toISOString()}\n`;
    updateSQL += `-- =====================================================\n\n`;
    updateSQL += `USE \`${dbConfig.database}\`;\n\n`;
    updateSQL += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    // Check if social_media table exists, if not create it
    const socialMediaExists = tables.some(table => table.TABLE_NAME === 'social_media');
    if (!socialMediaExists) {
      updateSQL += `-- =====================================================\n`;
      updateSQL += `-- Add social_media table\n`;
      updateSQL += `-- =====================================================\n`;
      updateSQL += `CREATE TABLE \`social_media\` (\n`;
      updateSQL += `  \`id\` int(11) NOT NULL AUTO_INCREMENT,\n`;
      updateSQL += `  \`platform\` varchar(50) NOT NULL,\n`;
      updateSQL += `  \`name_ar\` varchar(100) NOT NULL,\n`;
      updateSQL += `  \`url\` varchar(255) NOT NULL,\n`;
      updateSQL += `  \`icon\` varchar(50) NOT NULL,\n`;
      updateSQL += `  \`color\` varchar(7) DEFAULT '#000000',\n`;
      updateSQL += `  \`sort_order\` int(11) DEFAULT 0,\n`;
      updateSQL += `  \`is_active\` tinyint(1) DEFAULT 1,\n`;
      updateSQL += `  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),\n`;
      updateSQL += `  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),\n`;
      updateSQL += `  PRIMARY KEY (\`id\`),\n`;
      updateSQL += `  KEY \`idx_platform\` (\`platform\`),\n`;
      updateSQL += `  KEY \`idx_active\` (\`is_active\`),\n`;
      updateSQL += `  KEY \`idx_sort_order\` (\`sort_order\`)\n`;
      updateSQL += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      // Insert default social media data
      updateSQL += `-- Insert default social media platforms\n`;
      updateSQL += `INSERT INTO social_media (platform, name_ar, url, icon, color, sort_order, is_active) VALUES\n`;
      updateSQL += `('facebook', 'فيسبوك', 'https://facebook.com/newsmarkaba', 'FiFacebook', '#1877F2', 1, 1),\n`;
      updateSQL += `('twitter', 'تويتر', 'https://twitter.com/newsmarkaba', 'FiTwitter', '#1DA1F2', 2, 0),\n`;
      updateSQL += `('instagram', 'إنستغرام', 'https://instagram.com/newsmarkaba', 'FiInstagram', '#E4405F', 3, 1),\n`;
      updateSQL += `('youtube', 'يوتيوب', 'https://youtube.com/newsmarkaba', 'FiYoutube', '#FF0000', 4, 1),\n`;
      updateSQL += `('linkedin', 'لينكد إن', 'https://linkedin.com/company/newsmarkaba', 'FiLinkedin', '#0A66C2', 5, 0),\n`;
      updateSQL += `('telegram', 'تليغرام', 'https://t.me/newsmarkaba', 'FiSend', '#0088CC', 6, 1),\n`;
      updateSQL += `('whatsapp', 'واتساب', 'https://wa.me/newsmarkaba', 'FiMessageCircle', '#25D366', 7, 1);\n\n`;
    }
    
    // Check if site_settings table needs updates
    const siteSettingsExists = tables.some(table => table.TABLE_NAME === 'site_settings');
    if (siteSettingsExists) {
      // Check if new columns exist in site_settings
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'site_settings'
      `, [dbConfig.database]);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      updateSQL += `-- =====================================================\n`;
      updateSQL += `-- Update site_settings table structure\n`;
      updateSQL += `-- =====================================================\n`;
      
      if (!columnNames.includes('setting_value')) {
        updateSQL += `ALTER TABLE \`site_settings\` ADD COLUMN \`setting_value\` text DEFAULT NULL;\n`;
      }
      
      if (!columnNames.includes('data_type')) {
        updateSQL += `ALTER TABLE \`site_settings\` ADD COLUMN \`data_type\` enum('string','number','boolean','json') DEFAULT 'string';\n`;
      }
      
      if (!columnNames.includes('description_ar')) {
        updateSQL += `ALTER TABLE \`site_settings\` ADD COLUMN \`description_ar\` text DEFAULT NULL;\n`;
      }
      
      if (!columnNames.includes('is_public')) {
        updateSQL += `ALTER TABLE \`site_settings\` ADD COLUMN \`is_public\` tinyint(1) DEFAULT 0;\n`;
      }
      
      // Update existing data
      updateSQL += `\n-- Update existing site_settings data\n`;
      updateSQL += `UPDATE \`site_settings\` SET \`setting_value\` = \`setting_value_ar\` WHERE \`setting_value\` IS NULL;\n`;
      updateSQL += `UPDATE \`site_settings\` SET \`data_type\` = 'string' WHERE \`data_type\` IS NULL;\n`;
      updateSQL += `UPDATE \`site_settings\` SET \`is_public\` = 1 WHERE \`setting_key\` IN ('site_name', 'site_tagline', 'site_description', 'site_logo');\n\n`;
    }
    
    // Check if settings table needs optimization
    const settingsExists = tables.some(table => table.TABLE_NAME === 'settings');
    if (settingsExists) {
      updateSQL += `-- =====================================================\n`;
      updateSQL += `-- Optimize settings table indexes\n`;
      updateSQL += `-- =====================================================\n`;
      
      // Add indexes if they don't exist
      updateSQL += `-- Add indexes for better performance (ignore if exists)\n`;
      updateSQL += `ALTER TABLE \`settings\` ADD INDEX \`idx_settings_category_public\` (\`category\`, \`is_public\`);\n`;
      updateSQL += `ALTER TABLE \`settings\` ADD INDEX \`idx_settings_key_type\` (\`setting_key\`, \`setting_type\`);\n\n`;
    }
    
    // Check users table for security enhancements
    const usersExists = tables.some(table => table.TABLE_NAME === 'users');
    if (usersExists) {
      const [userColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [dbConfig.database]);
      
      const userColumnNames = userColumns.map(col => col.COLUMN_NAME);
      
      updateSQL += `-- =====================================================\n`;
      updateSQL += `-- Enhance users table security\n`;
      updateSQL += `-- =====================================================\n`;
      
      if (!userColumnNames.includes('failed_login_attempts')) {
        updateSQL += `ALTER TABLE \`users\` ADD COLUMN \`failed_login_attempts\` int(11) DEFAULT 0;\n`;
      }
      
      if (!userColumnNames.includes('lockout_until')) {
        updateSQL += `ALTER TABLE \`users\` ADD COLUMN \`lockout_until\` datetime DEFAULT NULL;\n`;
      }
      
      if (!userColumnNames.includes('last_login_ip')) {
        updateSQL += `ALTER TABLE \`users\` ADD COLUMN \`last_login_ip\` varchar(45) DEFAULT NULL;\n`;
      }
      
      if (!userColumnNames.includes('refresh_token')) {
        updateSQL += `ALTER TABLE \`users\` ADD COLUMN \`refresh_token\` varchar(255) DEFAULT NULL;\n`;
      }
      
      if (!userColumnNames.includes('refresh_token_expires')) {
        updateSQL += `ALTER TABLE \`users\` ADD COLUMN \`refresh_token_expires\` datetime DEFAULT NULL;\n`;
      }
      
      updateSQL += `\n`;
    }
    
    // Check posts table for SEO enhancements
    const postsExists = tables.some(table => table.TABLE_NAME === 'posts');
    if (postsExists) {
      const [postColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts'
      `, [dbConfig.database]);
      
      const postColumnNames = postColumns.map(col => col.COLUMN_NAME);
      
      updateSQL += `-- =====================================================\n`;
      updateSQL += `-- Enhance posts table for SEO\n`;
      updateSQL += `-- =====================================================\n`;
      
      if (!postColumnNames.includes('meta_title')) {
        updateSQL += `ALTER TABLE \`posts\` ADD COLUMN \`meta_title\` varchar(255) DEFAULT NULL;\n`;
      }
      
      if (!postColumnNames.includes('meta_description')) {
        updateSQL += `ALTER TABLE \`posts\` ADD COLUMN \`meta_description\` text DEFAULT NULL;\n`;
      }
      
      if (!postColumnNames.includes('meta_keywords')) {
        updateSQL += `ALTER TABLE \`posts\` ADD COLUMN \`meta_keywords\` text DEFAULT NULL;\n`;
      }
      
      updateSQL += `\n`;
    }
    
    // Add performance optimizations
    updateSQL += `-- =====================================================\n`;
    updateSQL += `-- Performance optimizations\n`;
    updateSQL += `-- =====================================================\n`;
    updateSQL += `-- Optimize table engines and character sets\n`;
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      updateSQL += `ALTER TABLE \`${tableName}\` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`;
    }
    
    updateSQL += `\n`;
    
    // Final cleanup
    updateSQL += `-- =====================================================\n`;
    updateSQL += `-- Final cleanup and optimization\n`;
    updateSQL += `-- =====================================================\n`;
    updateSQL += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    updateSQL += `-- Analyze tables for optimization\n`;
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      updateSQL += `ANALYZE TABLE \`${tableName}\`;\n`;
    }
    
    updateSQL += `\n-- Update script completed successfully\n`;
    updateSQL += `-- Total tables processed: ${tables.length}\n`;
    
    // Write to file
    const outputPath = path.join(__dirname, 'database-export.sql');
    fs.writeFileSync(outputPath, updateSQL, 'utf8');
    
    console.log(`\nUpdate SQL script generated successfully!`);
    console.log(`File saved to: ${outputPath}`);
    console.log(`Total tables processed: ${tables.length}`);
    
    // Display table summary
    console.log('\nTables processed:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TABLE_NAME}`);
    });
    
  } catch (error) {
    console.error('Error generating update SQL:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
generateUpdateSQL();