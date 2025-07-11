#!/usr/bin/env node

/**
 * Production Deployment Script for News Markaba
 * This script helps deploy the application to production server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting News Markaba Production Deployment...');

// Function to copy file
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`✅ Copied ${source} to ${destination}`);
  } catch (error) {
    console.error(`❌ Failed to copy ${source}:`, error.message);
  }
}

// Function to backup existing file
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`📦 Backed up ${filePath} to ${backupPath}`);
  }
}

try {
  // 1. Backup existing environment files
  console.log('\n📦 Creating backups...');
  backupFile('.env');
  backupFile('client/.env.local');

  // 2. Copy production environment files
  console.log('\n🔧 Setting up production environment...');
  copyFile('.env.production', '.env');
  copyFile('client/.env.production', 'client/.env.local');

  // 3. Build the client for production
  console.log('\n🏗️  Building client for production...');
  process.chdir('client');
  execSync('npm run build', { stdio: 'inherit' });
  process.chdir('..');

  // 4. Install production dependencies
  console.log('\n📦 Installing server dependencies...');
  process.chdir('server');
  execSync('npm install --production', { stdio: 'inherit' });
  process.chdir('..');

  console.log('\n✅ Production deployment preparation completed!');
  console.log('\n📋 Next steps for your VPS:');
  console.log('1. Upload the entire project to your server');
  console.log('2. Install Node.js and npm on your server');
  console.log('3. Install PM2: npm install -g pm2');
  console.log('4. Start the backend: cd server && pm2 start index.js --name "news-markaba-api"');
  console.log('5. Serve the client: cd client && pm2 serve out 80 --name "news-markaba-web"');
  console.log('6. Save PM2 configuration: pm2 save && pm2 startup');
  console.log('\n🌐 Your site will be available at: http://69.62.115.12/');
  console.log('🔗 API will be available at: http://69.62.115.12:5000/api');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}