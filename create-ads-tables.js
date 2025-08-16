const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from server/.env
require('dotenv').config({ path: './server/.env' });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '1234567890aa',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4'
};

async function createAdsTables() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'sql', 'create_ads_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL commands by semicolon and filter out empty statements
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));
    
    console.log(`Executing ${sqlCommands.length} SQL commands...`);
    
    // Execute each command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        try {
          console.log(`Executing command ${i + 1}/${sqlCommands.length}...`);
          await connection.execute(command);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            console.log(`Skipping duplicate: ${error.message}`);
          } else {
            console.error(`Error executing command ${i + 1}:`, error.message);
            console.error('Command:', command.substring(0, 100) + '...');
          }
        }
      }
    }
    
    console.log('✅ Ads tables created successfully!');
    
    // Verify tables were created
    const [tables] = await connection.execute("SHOW TABLES LIKE 'ad%'");
    console.log('Created tables:', tables.map(t => Object.values(t)[0]));
    
  } catch (error) {
    console.error('❌ Error creating ads tables:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
createAdsTables();