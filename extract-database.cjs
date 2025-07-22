const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || '1234567890aa',
      database: process.env.DB_NAME || 'markabadatabase'
    });
    
    console.log('✅ Connected to MySQL database successfully!');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function getAllTables(connection) {
  try {
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log(`📋 Found ${tableNames.length} tables:`, tableNames);
    return tableNames;
  } catch (error) {
    console.error('❌ Error getting tables:', error.message);
    throw error;
  }
}

async function getTableSchema(connection, tableName) {
  try {
    const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
    const [createTable] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
    
    return {
      columns,
      createStatement: createTable[0]['Create Table']
    };
  } catch (error) {
    console.error(`❌ Error getting schema for ${tableName}:`, error.message);
    throw error;
  }
}

async function getTableData(connection, tableName) {
  try {
    const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
    console.log(`📊 Table ${tableName}: ${rows.length} rows`);
    return rows;
  } catch (error) {
    console.error(`❌ Error getting data from ${tableName}:`, error.message);
    throw error;
  }
}

function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
}

function generateInsertStatements(tableName, columns, data) {
  if (data.length === 0) {
    return `-- No data in table ${tableName}\n`;
  }

  const columnNames = columns.map(col => col.Field);
  let sql = `-- Data for table ${tableName}\n`;
  sql += `DELETE FROM ${tableName};\n`;
  sql += `INSERT INTO ${tableName} (${columnNames.map(name => `\`${name}\``).join(', ')}) VALUES\n`;
  
  const values = data.map(row => {
    const rowValues = columnNames.map(col => escapeValue(row[col]));
    return `(${rowValues.join(', ')})`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
  
  return sql;
}

async function generateUpdateSQL() {
  let connection;
  
  try {
    connection = await connectToDatabase();
    
    // Get all tables
    const tables = await getAllTables(connection);
    
    // Generate SQL export
    let fullSQL = `-- =====================================================
-- Database Export: ${process.env.DB_NAME}
-- Generated: ${new Date().toISOString()}
-- Host: ${process.env.DB_HOST}:${process.env.DB_PORT}
-- =====================================================

USE ${process.env.DB_NAME};

SET FOREIGN_KEY_CHECKS = 0;

`;
    
    // Generate schema and data for each table
    for (const tableName of tables) {
      console.log(`🔄 Processing table: ${tableName}`);
      
      try {
        // Get table schema
        const schema = await getTableSchema(connection, tableName);
        
        // Add table creation
        fullSQL += `-- =====================================================\n`;
        fullSQL += `-- Table: ${tableName}\n`;
        fullSQL += `-- =====================================================\n`;
        fullSQL += `DROP TABLE IF EXISTS ${tableName};\n`;
        fullSQL += schema.createStatement + ';\n\n';
        
        // Get table data
        const data = await getTableData(connection, tableName);
        
        // Generate insert statements
        if (data.length > 0) {
          fullSQL += generateInsertStatements(tableName, schema.columns, data);
        } else {
          fullSQL += `-- No data in table ${tableName}\n\n`;
        }
        
      } catch (error) {
        console.error(`⚠️  Skipping table ${tableName}:`, error.message);
        fullSQL += `-- Error processing table ${tableName}: ${error.message}\n\n`;
      }
    }
    
    // Re-enable foreign key checks
    fullSQL += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;
    
    // Write to file
    const outputFile = path.join(__dirname, 'database-export.sql');
    await fs.writeFile(outputFile, fullSQL, 'utf8');
    
    console.log(`\n✅ Database export completed successfully!`);
    console.log(`📄 SQL file saved to: ${outputFile}`);
    console.log(`📊 Total tables processed: ${tables.length}`);
    
    return outputFile;
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the export
if (require.main === module) {
  generateUpdateSQL()
    .then(outputFile => {
      console.log(`\n🎉 Export complete! Check the file: ${outputFile}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Export failed:', error);
      process.exit(1);
    });
}

module.exports = { generateUpdateSQL };