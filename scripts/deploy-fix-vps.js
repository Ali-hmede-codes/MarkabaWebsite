#!/usr/bin/env node

/**
 * VPS Deployment Fix Script
 * This script helps diagnose and fix common VPS deployment issues
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 News Markaba VPS Deployment Fix Script');
console.log('==========================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    log(`\n📋 ${description}`, 'blue');
    log(`Command: ${command}`, 'cyan');
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`❌ Error: ${error.message}`, 'red');
        reject(error);
        return;
      }
      
      if (stderr) {
        log(`⚠️  Warning: ${stderr}`, 'yellow');
      }
      
      if (stdout) {
        log(`✅ Output: ${stdout}`, 'green');
      }
      
      resolve(stdout);
    });
  });
}

async function checkVPSStatus() {
  try {
    log('\n🔍 Checking VPS Status...', 'cyan');
    
    // Check if PM2 is installed
    try {
      await runCommand('pm2 --version', 'Checking PM2 installation');
    } catch (error) {
      log('\n❌ PM2 is not installed. Installing PM2...', 'red');
      await runCommand('npm install -g pm2', 'Installing PM2 globally');
    }
    
    // Check PM2 status
    await runCommand('pm2 status', 'Checking PM2 processes');
    
    // Check if backend is running
    await runCommand('pm2 logs markaba-backend --lines 10', 'Checking backend logs');
    
    // Check if frontend is running
    await runCommand('pm2 logs markaba-frontend --lines 10', 'Checking frontend logs');
    
    // Test API endpoint
    await runCommand('curl -I http://localhost:5000/health', 'Testing backend health endpoint');
    
    // Test database connection
    await runCommand('mysql -u admin -p1234567890aa -e "USE markabadatabase; SHOW TABLES;"', 'Testing database connection');
    
  } catch (error) {
    log(`\n❌ Error during status check: ${error.message}`, 'red');
  }
}

async function fixVPSDeployment() {
  try {
    log('\n🚀 Starting VPS Deployment Fix...', 'cyan');
    
    // Stop existing PM2 processes
    log('\n🛑 Stopping existing processes...', 'yellow');
    await runCommand('pm2 stop all', 'Stopping all PM2 processes');
    await runCommand('pm2 delete all', 'Deleting all PM2 processes');
    
    // Install dependencies
    log('\n📦 Installing dependencies...', 'blue');
    await runCommand('cd /var/www/MarkabaWebsite/server && npm install', 'Installing server dependencies');
    await runCommand('cd /var/www/MarkabaWebsite/client && npm install', 'Installing client dependencies');
    
    // Build client
    log('\n🏗️  Building client...', 'blue');
    await runCommand('cd /var/www/MarkabaWebsite/client && npm run build', 'Building Next.js client');
    
    // Start services with PM2
    log('\n🚀 Starting services...', 'green');
    await runCommand('cd /var/www/MarkabaWebsite && pm2 start ecosystem.config.js --env production', 'Starting PM2 services');
    
    // Save PM2 configuration
    await runCommand('pm2 save', 'Saving PM2 configuration');
    
    // Setup PM2 startup
    await runCommand('pm2 startup', 'Setting up PM2 startup');
    
    log('\n✅ VPS Deployment Fix Complete!', 'green');
    
  } catch (error) {
    log(`\n❌ Error during deployment fix: ${error.message}`, 'red');
  }
}

async function testEndpoints() {
  try {
    log('\n🧪 Testing API Endpoints...', 'cyan');
    
    // Test health endpoint
    await runCommand('curl -s http://localhost:5000/health', 'Testing health endpoint');
    
    // Test admin last-news endpoint
    await runCommand('curl -s -H "Authorization: Bearer test-token" http://localhost:5000/api/admin/administratorpage/last-news', 'Testing last-news endpoint');
    
    // Test frontend
    await runCommand('curl -I http://localhost:3000', 'Testing frontend');
    
  } catch (error) {
    log(`\n❌ Error during endpoint testing: ${error.message}`, 'red');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check') || args.includes('-c')) {
    await checkVPSStatus();
  } else if (args.includes('--fix') || args.includes('-f')) {
    await fixVPSDeployment();
  } else if (args.includes('--test') || args.includes('-t')) {
    await testEndpoints();
  } else {
    log('\n📖 Usage:', 'cyan');
    log('  node fix-vps-deployment.js --check    # Check current VPS status', 'reset');
    log('  node fix-vps-deployment.js --fix     # Fix VPS deployment issues', 'reset');
    log('  node fix-vps-deployment.js --test    # Test API endpoints', 'reset');
    log('\n🔧 Recommended sequence:', 'yellow');
    log('  1. node fix-vps-deployment.js --check', 'reset');
    log('  2. node fix-vps-deployment.js --fix', 'reset');
    log('  3. node fix-vps-deployment.js --test', 'reset');
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkVPSStatus, fixVPSDeployment, testEndpoints };