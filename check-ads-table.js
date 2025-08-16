const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdsTable() {
  let connection;
  
  try {
    console.log('🔍 Checking ads table structure...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'markabadatabase',
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false
    });
    
    console.log('✅ Connected to database');
    
    // Check if ads table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'ads'"
    );
    
    if (tables.length === 0) {
      console.log('❌ ads table does not exist');
      return;
    }
    
    console.log('✅ ads table exists');
    
    // Check ads table structure
    const [adsColumns] = await connection.execute('DESCRIBE ads');
    console.log('\n📋 ads table structure:');
    adsColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    // Check ad_positions table
    const [positionTables] = await connection.execute(
      "SHOW TABLES LIKE 'ad_positions'"
    );
    
    if (positionTables.length === 0) {
      console.log('\n❌ ad_positions table does not exist');
      return;
    }
    
    console.log('\n✅ ad_positions table exists');
    
    // Check ad_positions table structure
    const [positionsColumns] = await connection.execute('DESCRIBE ad_positions');
    console.log('\n📋 ad_positions table structure:');
    positionsColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    // Check users table for foreign key
    const [userTables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (userTables.length === 0) {
      console.log('\n❌ users table does not exist');
      return;
    }
    
    console.log('\n✅ users table exists');
    
    // Test a simple query on ads table
    console.log('\n🧪 Testing ads query...');
    try {
      const [testResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM ads'
      );
      console.log(`✅ ads table query successful - ${testResult[0].count} records found`);
    } catch (queryError) {
      console.log('❌ ads table query failed:', queryError.message);
    }
    
    // Test the exact query from the route
    console.log('\n🧪 Testing complex ads query...');
    try {
      const [complexResult] = await connection.execute(`
        SELECT 
          a.id, a.title, a.image_path, a.link_url, a.start_date, a.expire_date,
          a.is_active, a.clicks, a.created_at, a.updated_at,
          ap.name as position_name, ap.name_ar as position_name_ar,
          ap.width, ap.height,
          u.username as created_by_username, u.display_name as created_by_name,
          CASE 
            WHEN a.expire_date <= NOW() THEN 'expired'
            WHEN a.is_active = 1 THEN 'active'
            ELSE 'inactive'
          END as status
        FROM ads a
        LEFT JOIN ad_positions ap ON a.position_id = ap.id
        LEFT JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
        LIMIT 10 OFFSET 0
      `);
      console.log(`✅ Complex ads query successful - ${complexResult.length} records found`);
      
      if (complexResult.length > 0) {
        console.log('\n📋 Sample ad record:');
        const sample = complexResult[0];
        Object.keys(sample).forEach(key => {
          console.log(`   - ${key}: ${sample[key]}`);
        });
      }
    } catch (complexError) {
      console.log('❌ Complex ads query failed:', complexError.message);
      console.log('📋 Error details:', complexError);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('📋 Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkAdsTable();