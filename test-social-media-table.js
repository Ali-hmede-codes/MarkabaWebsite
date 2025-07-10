const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSocialMediaTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'news_site',
    charset: 'utf8mb4'
  });

  try {
    console.log('Testing social_media table...');

    // Check if table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'social_media'"
    );
    
    if (tables.length === 0) {
      console.log('❌ social_media table does not exist!');
      return;
    }
    
    console.log('✓ social_media table exists');

    // Check table structure
    const [columns] = await connection.execute(
      "DESCRIBE social_media"
    );
    
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if there's any data
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM social_media'
    );
    
    console.log(`\n📊 Total records: ${rows[0].count}`);

    // Try the exact query from the route
    const [testRows] = await connection.execute(
      'SELECT * FROM social_media WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    
    console.log(`\n✅ Query test successful! Found ${testRows.length} active social media links`);
    
    if (testRows.length > 0) {
      console.log('\n📋 Sample data:');
      testRows.forEach(row => {
        console.log(`  ${row.platform}: ${row.name_ar} (${row.url})`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing social media table:', error.message);
    console.error('Full error:', error);
  } finally {
    await connection.end();
  }
}

testSocialMediaTable();