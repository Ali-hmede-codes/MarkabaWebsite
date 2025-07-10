#!/usr/bin/env node

/**
 * Test Setup Script for NewsMarkaba
 * This script tests the database connection and API endpoints
 */

const http = require('http');
const https = require('https');
const { testConnection } = require('./server/db');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}🧪${colors.reset} ${msg}`)
};

class SetupTester {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async testDatabaseConnection() {
    log.test('Testing database connection...');
    try {
      await testConnection();
      log.success('Database connection successful');
      return true;
    } catch (error) {
      log.error(`Database connection failed: ${error.message}`);
      return false;
    }
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const request = client.get(url, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            data: data,
            headers: response.headers
          });
        });
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async testEndpoint(name, url) {
    try {
      const response = await this.makeRequest(url);
      if (response.statusCode === 200) {
        log.success(`${name}: OK (${response.statusCode})`);
        return true;
      } else {
        log.warning(`${name}: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      log.error(`${name}: ${error.message}`);
      return false;
    }
  }

  async testBackendEndpoints() {
    log.test('Testing backend API endpoints...');
    
    const endpoints = [
      { name: 'Health Check', url: `${this.backendUrl}/api/health` },
      { name: 'Categories', url: `${this.backendUrl}/api/categories` },
      { name: 'Posts', url: `${this.backendUrl}/api/posts` },
      { name: 'Settings', url: `${this.backendUrl}/api/settings` },
      { name: 'Breaking News', url: `${this.backendUrl}/api/breaking-news` }
    ];
    
    let successCount = 0;
    for (const endpoint of endpoints) {
      if (await this.testEndpoint(endpoint.name, endpoint.url)) {
        successCount++;
      }
    }
    
    log.info(`Backend API: ${successCount}/${endpoints.length} endpoints working`);
    return successCount === endpoints.length;
  }

  async testFrontend() {
    log.test('Testing frontend availability...');
    return await this.testEndpoint('Frontend', this.frontendUrl);
  }

  async checkRequiredFiles() {
    log.test('Checking required files...');
    const fs = require('fs');
    const path = require('path');
    
    const requiredFiles = [
      '.env',
      'server/package.json',
      'server/index.js',
      'server/db.js',
      'client/package.json',
      'sql/create_tables.sql'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        log.success(`Found: ${file}`);
      } else {
        log.error(`Missing: ${file}`);
        allFilesExist = false;
      }
    }
    
    return allFilesExist;
  }

  async checkEnvironmentVariables() {
    log.test('Checking environment variables...');
    
    const requiredEnvVars = [
      'DB_HOST',
      'DB_USER',
      'DB_NAME',
      'JWT_SECRET',
      'PORT'
    ];
    
    let allVarsSet = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        log.success(`${envVar}: Set`);
      } else {
        log.error(`${envVar}: Not set`);
        allVarsSet = false;
      }
    }
    
    // Check for default/insecure values
    if (process.env.JWT_SECRET === 'your_super_secret_key_change_this_in_production') {
      log.warning('JWT_SECRET is using default value - change this for production!');
    }
    
    if (process.env.DB_PASSWORD === 'yourpassword') {
      log.warning('DB_PASSWORD appears to be using default value');
    }
    
    return allVarsSet;
  }

  async run() {
    console.log(`${colors.cyan}🧪 NewsMarkaba Setup Test${colors.reset}\n`);
    
    const tests = [
      { name: 'Required Files', test: () => this.checkRequiredFiles() },
      { name: 'Environment Variables', test: () => this.checkEnvironmentVariables() },
      { name: 'Database Connection', test: () => this.testDatabaseConnection() },
      { name: 'Backend Endpoints', test: () => this.testBackendEndpoints() },
      { name: 'Frontend', test: () => this.testFrontend() }
    ];
    
    let passedTests = 0;
    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      try {
        if (await test.test()) {
          passedTests++;
        }
      } catch (error) {
        log.error(`Test failed: ${error.message}`);
      }
    }
    
    console.log(`\n${colors.cyan}📊 Test Results${colors.reset}`);
    console.log(`Passed: ${passedTests}/${tests.length} tests`);
    
    if (passedTests === tests.length) {
      console.log(`\n${colors.green}🎉 All tests passed! Your setup is ready.${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠️  Some tests failed. Check the issues above.${colors.reset}`);
      
      console.log(`\n${colors.cyan}💡 Common Solutions:${colors.reset}`);
      console.log('• Make sure MySQL is running');
      console.log('• Check your .env file configuration');
      console.log('• Run: npm install in both server/ and client/ directories');
      console.log('• Start the backend: cd server && npm run dev');
      console.log('• Start the frontend: cd client && npm run dev');
    }
    
    console.log(`\n${colors.cyan}📚 Useful Commands:${colors.reset}`);
    console.log('• Setup database: node setup-database.js');
    console.log('• Test setup: node test-setup.js');
    console.log('• Start backend: cd server && npm run dev');
    console.log('• Start frontend: cd client && npm run dev');
    console.log('• View logs: Check terminal output for errors\n');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const tester = new SetupTester();
  tester.run().catch(error => {
    log.error(`Test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = SetupTester;