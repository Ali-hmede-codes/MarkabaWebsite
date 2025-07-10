const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

async function setupSocialMedia() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'news_site',
      charset: 'utf8mb4'
    });
    
    console.log('Connected to database');
    
    // Check if social_media table exists
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM social_media');
      console.log(`Social media table exists with ${rows[0].count} records`);
      
      if (rows[0].count === 0) {
        console.log('Table is empty, inserting sample data...');
        
        // Insert sample social media data
        const insertQuery = `
          INSERT INTO social_media (platform, name_ar, url, icon, color, sort_order, is_active) VALUES 
          ('facebook', 'فيسبوك', 'https://facebook.com/newsmarkaba', 'FiFacebook', '#1877F2', 1, TRUE),
          ('twitter', 'تويتر', 'https://twitter.com/newsmarkaba', 'FiTwitter', '#1DA1F2', 2, TRUE),
          ('instagram', 'إنستغرام', 'https://instagram.com/newsmarkaba', 'FiInstagram', '#E4405F', 3, TRUE),
          ('youtube', 'يوتيوب', 'https://youtube.com/newsmarkaba', 'FiYoutube', '#FF0000', 4, TRUE),
          ('linkedin', 'لينكد إن', 'https://linkedin.com/company/newsmarkaba', 'FiLinkedin', '#0A66C2', 5, FALSE),
          ('telegram', 'تليغرام', 'https://t.me/newsmarkaba', 'FiSend', '#0088CC', 6, FALSE),
          ('whatsapp', 'واتساب', 'https://wa.me/newsmarkaba', 'FiMessageCircle', '#25D366', 7, FALSE)
        `;
        
        await connection.execute(insertQuery);
        console.log('Sample social media data inserted successfully!');
      } else {
        console.log('Social media data already exists');
      }
      
      // Display current data
      const [socialMediaData] = await connection.execute('SELECT * FROM social_media ORDER BY sort_order');
      console.log('\nCurrent social media data:');
      socialMediaData.forEach(item => {
        console.log(`- ${item.name_ar} (${item.platform}): ${item.url} [Active: ${item.is_active}]`);
      });
      
    } catch (tableError) {
      console.log('Social media table does not exist, creating it...');
      
      // Create the table
      const createTableQuery = `
        CREATE TABLE social_media (
          id INT AUTO_INCREMENT PRIMARY KEY,
          platform VARCHAR(50) NOT NULL,
          name_ar VARCHAR(100) NOT NULL,
          url VARCHAR(255) NOT NULL,
          icon VARCHAR(50) NOT NULL,
          color VARCHAR(7) DEFAULT '#000000',
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_platform (platform),
          INDEX idx_active (is_active),
          INDEX idx_sort_order (sort_order)
        )
      `;
      
      await connection.execute(createTableQuery);
      console.log('Social media table created successfully!');
      
      // Insert sample data
      const insertQuery = `
        INSERT INTO social_media (platform, name_ar, url, icon, color, sort_order, is_active) VALUES 
        ('facebook', 'فيسبوك', 'https://facebook.com/newsmarkaba', 'FiFacebook', '#1877F2', 1, TRUE),
        ('twitter', 'تويتر', 'https://twitter.com/newsmarkaba', 'FiTwitter', '#1DA1F2', 2, TRUE),
        ('instagram', 'إنستغرام', 'https://instagram.com/newsmarkaba', 'FiInstagram', '#E4405F', 3, TRUE),
        ('youtube', 'يوتيوب', 'https://youtube.com/newsmarkaba', 'FiYoutube', '#FF0000', 4, TRUE),
        ('linkedin', 'لينكد إن', 'https://linkedin.com/company/newsmarkaba', 'FiLinkedin', '#0A66C2', 5, FALSE),
        ('telegram', 'تليغرام', 'https://t.me/newsmarkaba', 'FiSend', '#0088CC', 6, FALSE),
        ('whatsapp', 'واتساب', 'https://wa.me/newsmarkaba', 'FiMessageCircle', '#25D366', 7, FALSE)
      `;
      
      await connection.execute(insertQuery);
      console.log('Sample social media data inserted successfully!');
    }
    
  } catch (error) {
    console.error('Error setting up social media:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupSocialMedia();