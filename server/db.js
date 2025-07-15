const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  multipleStatements: false,
  ssl: false
};

// Create connection pool for better performance
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  charset: dbConfig.charset,
  timezone: dbConfig.timezone,
  ssl: dbConfig.ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Execute query helper function
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', {
      message: error.message,
      code: error.code,
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params: params
    });
    throw error;
  }
};

// Get single record
const queryOne = async (sql, params = []) => {
  const results = await query(sql, params);
  return results[0] || null;
};

module.exports = {
  pool,
  query,
  queryOne,
  testConnection
};