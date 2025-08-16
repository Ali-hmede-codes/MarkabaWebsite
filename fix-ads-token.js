const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function fixAdsTokenIssue() {
  let connection;
  
  try {
    console.log('🔧 Starting ads token fix...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
    
    // 1. Create ads tables if they don't exist
    console.log('📋 Creating ads tables...');
    
    // Create ad_positions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`ad_positions\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`name_ar\` varchar(100) NOT NULL,
        \`description\` text,
        \`width\` int(11) NOT NULL,
        \`height\` int(11) NOT NULL,
        \`is_active\` tinyint(1) DEFAULT 1,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`name\` (\`name\`),
        KEY \`idx_is_active\` (\`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Create ads table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`ads\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`image_path\` varchar(500) NOT NULL,
        \`link_url\` varchar(1000) NOT NULL,
        \`position_id\` int(11) NOT NULL,
        \`start_date\` datetime DEFAULT CURRENT_TIMESTAMP,
        \`expire_date\` datetime NOT NULL,
        \`is_active\` tinyint(1) DEFAULT 1,
        \`clicks\` int(11) DEFAULT 0,
        \`created_by\` int(11) NOT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_position_id\` (\`position_id\`),
        KEY \`idx_is_active\` (\`is_active\`),
        KEY \`idx_expire_date\` (\`expire_date\`),
        KEY \`idx_created_by\` (\`created_by\`),
        KEY \`idx_start_expire\` (\`start_date\`, \`expire_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Create ads_inactive table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`ads_inactive\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`original_ad_id\` int(11) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`image_path\` varchar(500) NOT NULL,
        \`link_url\` varchar(1000) NOT NULL,
        \`position_id\` int(11) NOT NULL,
        \`start_date\` datetime NOT NULL,
        \`expire_date\` datetime NOT NULL,
        \`clicks\` int(11) DEFAULT 0,
        \`created_by\` int(11) NOT NULL,
        \`created_at\` timestamp NOT NULL,
        \`updated_at\` timestamp NOT NULL,
        \`expired_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_original_ad_id\` (\`original_ad_id\`),
        KEY \`idx_position_id\` (\`position_id\`),
        KEY \`idx_expired_at\` (\`expired_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Ads tables created successfully');
    
    // 2. Insert default ad positions
    console.log('📝 Inserting default ad positions...');
    
    await connection.execute(`
      INSERT IGNORE INTO \`ad_positions\` (\`name\`, \`name_ar\`, \`description\`, \`width\`, \`height\`) VALUES
      ('header_banner', 'بانر الرأس', 'إعلان في أعلى الصفحة', 728, 90),
      ('sidebar_top', 'الشريط الجانبي العلوي', 'إعلان في أعلى الشريط الجانبي', 300, 250),
      ('sidebar_middle', 'الشريط الجانبي الأوسط', 'إعلان في وسط الشريط الجانبي', 300, 250),
      ('content_middle', 'وسط المحتوى', 'إعلان في وسط المحتوى', 728, 90),
      ('footer_banner', 'بانر التذييل', 'إعلان في أسفل الصفحة', 728, 90)
    `);
    
    console.log('✅ Default ad positions inserted');
    
    // 3. Check if uploads/ads directory exists and create it
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(__dirname, 'server', 'public', 'uploads', 'ads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads/ads directory');
    }
    
    // 4. Verify tables exist and have data
    const [positions] = await connection.execute('SELECT COUNT(*) as count FROM ad_positions');
    console.log(`📊 Ad positions count: ${positions[0].count}`);
    
    const [ads] = await connection.execute('SELECT COUNT(*) as count FROM ads');
    console.log(`📊 Ads count: ${ads[0].count}`);
    
    console.log('\n🎉 Ads token issue fix completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database tables created');
    console.log('   ✅ Default ad positions inserted');
    console.log('   ✅ Upload directory created');
    console.log('   ✅ Token authentication should now work for ads endpoints');
    console.log('\n🔄 Please restart your server to apply changes.');
    
  } catch (error) {
    console.error('❌ Error fixing ads token issue:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
fixAdsTokenIssue();