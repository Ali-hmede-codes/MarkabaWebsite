const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Setup script for ads database tables
 * Creates all necessary tables for the custom ads system
 */

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function setupAdsDatabase() {
  let connection;
  
  try {
    console.log('🚀 Starting ads database setup...');
    console.log('📊 Database config:', {
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user
    });
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');
    
    // Read and execute SQL file
    const sqlFilePath = path.join(__dirname, 'sql', 'create_ads_table.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} - Table already exists, skipping`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    
    const tables = ['ads', 'ads_positions', 'ads_clicks', 'ads_impressions'];
    for (const table of tables) {
      const [rows] = await connection.execute(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
        [dbConfig.database, table]
      );
      
      if (rows[0].count > 0) {
        console.log(`✅ Table '${table}' exists`);
        
        // Show table structure
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`   📋 Columns: ${columns.map(col => col.Field).join(', ')}`);
      } else {
        console.log(`❌ Table '${table}' not found`);
      }
    }
    
    // Check if default positions were inserted
    const [positionsCount] = await connection.execute('SELECT COUNT(*) as count FROM ads_positions');
    console.log(`📍 Default ad positions: ${positionsCount[0].count} positions available`);
    
    if (positionsCount[0].count > 0) {
      const [positions] = await connection.execute('SELECT position_name, display_name, width, height, max_ads FROM ads_positions ORDER BY id');
      console.log('📋 Available ad positions:');
      positions.forEach(pos => {
        console.log(`   • ${pos.display_name} (${pos.position_name}): ${pos.width}x${pos.height}px, max ${pos.max_ads} ads`);
      });
    }
    
    console.log('🎉 Ads database setup completed successfully!');
    console.log('📢 You can now use the ads API endpoints:');
    console.log('   • GET /api/ads - Get all ads');
    console.log('   • GET /api/ads/positions - Get available positions');
    console.log('   • POST /api/ads - Create new ad (admin only)');
    console.log('   • PUT /api/ads/:id - Update ad (admin only)');
    console.log('   • DELETE /api/ads/:id - Delete ad (admin only)');
    console.log('   • POST /api/ads/:id/click - Track ad click');
    console.log('   • POST /api/ads/:id/impression - Track ad impression');
    console.log('   • GET /api/ads/:id/stats - Get ad statistics (admin only)');
    
  } catch (error) {
    console.error('❌ Ads database setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAdsDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupAdsDatabase;