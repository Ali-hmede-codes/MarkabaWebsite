const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Production database config (same as server uses)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function testProductionDatabase() {
  console.log('🔍 Testing Production Database Connection...');
  console.log('Database Config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '***hidden***' : 'empty'
  });
  
  let connection;
  
  try {
    // Test connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful');
    
    // Check if ads table exists
    console.log('\n📋 Checking if ads table exists...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'ads'"
    );
    
    if (tables.length === 0) {
      console.log('❌ ads table does NOT exist');
      
      // Show all tables
      console.log('\n📋 Available tables:');
      const [allTables] = await connection.execute('SHOW TABLES');
      allTables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    } else {
      console.log('✅ ads table exists');
      
      // Check ads table structure
      console.log('\n📋 ads table structure:');
      const [columns] = await connection.execute('DESCRIBE ads');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
    // Check if ad_positions table exists
    console.log('\n📋 Checking if ad_positions table exists...');
    const [positionTables] = await connection.execute(
      "SHOW TABLES LIKE 'ad_positions'"
    );
    
    if (positionTables.length === 0) {
      console.log('❌ ad_positions table does NOT exist');
    } else {
      console.log('✅ ad_positions table exists');
      
      // Check ad_positions data
      console.log('\n📋 ad_positions data:');
      const [positions] = await connection.execute('SELECT * FROM ad_positions');
      console.log(`Found ${positions.length} positions:`);
      positions.forEach(pos => {
        console.log(`  - ID: ${pos.id}, Name: ${pos.name}, Active: ${pos.is_active}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('SQL State:', error.sqlState);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Test the actual API endpoint
async function testProductionAPI() {
  console.log('\n🌐 Testing Production API Endpoint...');
  
  try {
    // First try to login
    console.log('1️⃣ Attempting login...');
    const loginResponse = await axios.post('https://newsmarkaba.com/api/auth/login', {
      email: 'admin@newsmarkaba.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test ads endpoint
    console.log('2️⃣ Testing ads endpoint...');
    const adsResponse = await axios.get('https://newsmarkaba.com/api/admin/ads', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Ads endpoint successful');
    console.log('Response:', adsResponse.data);
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
  }
}

async function main() {
  await testProductionDatabase();
  await testProductionAPI();
}

main().catch(console.error);