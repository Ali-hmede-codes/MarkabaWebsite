const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixProductionDatabase() {
  let connection;
  
  try {
    console.log('🔧 Fixing production database schema...');
    
    // Database configuration for production
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: false
    };
    
    console.log(`📡 Connecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database successfully!');
    
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'sql', 'add_auth_columns_to_users.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL statements by semicolon and filter out empty ones
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await connection.execute(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Column already exists, skipping statement ${i + 1}`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    // Verify the columns were added
    console.log('🔍 Verifying database schema...');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [dbConfig.database]
    );
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const requiredColumns = ['failed_login_attempts', 'lockout_until', 'last_login_ip', 'refresh_token', 'refresh_token_expires'];
    
    console.log('📋 Current users table columns:');
    columnNames.forEach(col => console.log(`   - ${col}`));
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('\n🎉 All required authentication columns are present!');
    } else {
      console.log('\n⚠️  Missing columns:', missingColumns);
    }
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
fixProductionDatabase()
  .then(() => {
    console.log('\n✨ Production database fix completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });