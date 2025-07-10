#!/usr/bin/env node

/**
 * Database Setup Script for NewsMarkaba
 * This script helps automate the database setup process
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env' });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}🔧${colors.reset} ${msg}`)
};

class DatabaseSetup {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    };
    this.dbName = process.env.DB_NAME || 'news_site';
  }

  async createConnection(includeDatabase = false) {
    try {
      const config = { ...this.config };
      if (includeDatabase) {
        config.database = this.dbName;
      }
      return await mysql.createConnection(config);
    } catch (error) {
      throw new Error(`Failed to connect to MySQL: ${error.message}`);
    }
  }

  async testConnection() {
    log.step('Testing MySQL connection...');
    try {
      const connection = await this.createConnection();
      await connection.ping();
      log.success('MySQL connection successful');
      await connection.end();
      return true;
    } catch (error) {
      log.error(`MySQL connection failed: ${error.message}`);
      return false;
    }
  }

  async createDatabase() {
    log.step(`Creating database '${this.dbName}'...`);
    try {
      const connection = await this.createConnection();
      
      // Check if database exists
      const [rows] = await connection.execute(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [this.dbName]
      );
      
      if (rows.length > 0) {
        log.warning(`Database '${this.dbName}' already exists`);
      } else {
        await connection.execute(
          `CREATE DATABASE ${this.dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        log.success(`Database '${this.dbName}' created successfully`);
      }
      
      await connection.end();
      return true;
    } catch (error) {
      log.error(`Failed to create database: ${error.message}`);
      return false;
    }
  }

  async executeSQLFile() {
    log.step('Executing SQL schema file...');
    try {
      const sqlPath = path.join(__dirname, 'sql', 'create_tables.sql');
      
      if (!fs.existsSync(sqlPath)) {
        throw new Error(`SQL file not found: ${sqlPath}`);
      }
      
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      const connection = await this.createConnection(true);
      
      // Split SQL content by semicolons and execute each statement
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
          } catch (error) {
            // Skip errors for statements that might already exist
            if (!error.message.includes('already exists')) {
              log.warning(`SQL Warning: ${error.message}`);
            }
          }
        }
      }
      
      log.success('Database schema created successfully');
      await connection.end();
      return true;
    } catch (error) {
      log.error(`Failed to execute SQL file: ${error.message}`);
      return false;
    }
  }

  async verifyTables() {
    log.step('Verifying database tables...');
    try {
      const connection = await this.createConnection(true);
      const [tables] = await connection.execute('SHOW TABLES');
      
      const expectedTables = ['users', 'categories', 'posts', 'breaking_news', 'site_settings'];
      const existingTables = tables.map(row => Object.values(row)[0]);
      
      log.info(`Found ${existingTables.length} tables:`);
      existingTables.forEach(table => {
        const exists = expectedTables.includes(table);
        console.log(`  ${exists ? '✅' : '❓'} ${table}`);
      });
      
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      if (missingTables.length > 0) {
        log.warning(`Missing tables: ${missingTables.join(', ')}`);
      } else {
        log.success('All required tables are present');
      }
      
      await connection.end();
      return missingTables.length === 0;
    } catch (error) {
      log.error(`Failed to verify tables: ${error.message}`);
      return false;
    }
  }

  async checkSampleData() {
    log.step('Checking sample data...');
    try {
      const connection = await this.createConnection(true);
      
      // Check for admin user
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
      const adminCount = users[0].count;
      
      // Check for categories
      const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
      const categoryCount = categories[0].count;
      
      // Check for settings
      const [settings] = await connection.execute('SELECT COUNT(*) as count FROM site_settings');
      const settingsCount = settings[0].count;
      
      log.info('Sample data status:');
      console.log(`  👤 Admin users: ${adminCount}`);
      console.log(`  📁 Categories: ${categoryCount}`);
      console.log(`  ⚙️  Settings: ${settingsCount}`);
      
      if (adminCount === 0) {
        log.warning('No admin user found. You may need to create one.');
      }
      
      await connection.end();
      return true;
    } catch (error) {
      log.error(`Failed to check sample data: ${error.message}`);
      return false;
    }
  }

  async run() {
    console.log(`${colors.magenta}🗄️  NewsMarkaba Database Setup${colors.reset}\n`);
    
    // Step 1: Test connection
    if (!(await this.testConnection())) {
      log.error('Please check your MySQL installation and credentials in .env file');
      process.exit(1);
    }
    
    // Step 2: Create database
    if (!(await this.createDatabase())) {
      log.error('Failed to create database');
      process.exit(1);
    }
    
    // Step 3: Execute SQL schema
    if (!(await this.executeSQLFile())) {
      log.error('Failed to create database schema');
      process.exit(1);
    }
    
    // Step 4: Verify tables
    if (!(await this.verifyTables())) {
      log.warning('Some tables may be missing, but continuing...');
    }
    
    // Step 5: Check sample data
    await this.checkSampleData();
    
    console.log(`\n${colors.green}🎉 Database setup completed successfully!${colors.reset}`);
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log('1. Start the backend server: cd server && npm run dev');
    console.log('2. Start the frontend: cd client && npm run dev');
    console.log('3. Access the app at: http://localhost:3000');
    console.log('4. Login with: admin@newssite.com / admin123\n');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.run().catch(error => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = DatabaseSetup;