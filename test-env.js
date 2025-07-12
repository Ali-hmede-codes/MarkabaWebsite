#!/usr/bin/env node

/**
 * Environment Variables Test Script
 * This script tests if all environment variables are loaded correctly
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('='.repeat(60));
console.log('ENVIRONMENT VARIABLES TEST');
console.log('='.repeat(60));

console.log('\n📁 Environment File Location:');
console.log('- .env path:', path.resolve(__dirname, '.env'));

console.log('\n🗄️  Database Configuration:');
console.log('- DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('- DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('- DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '***HIDDEN***' : 'NOT SET');
console.log('- DB_NAME:', process.env.DB_NAME || 'NOT SET');

console.log('\n🖥️  Server Configuration:');
console.log('- PORT:', process.env.PORT || 'NOT SET');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '***HIDDEN***' : 'NOT SET');

console.log('\n🌐 URL Configuration:');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('- BACKEND_URL:', process.env.BACKEND_URL || 'NOT SET');

console.log('\n🔗 Client Environment Variables:');
console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET');
console.log('- NEXT_PUBLIC_UPLOAD_URL:', process.env.NEXT_PUBLIC_UPLOAD_URL || 'NOT SET');
console.log('- NEXT_PUBLIC_SERVER_URL:', process.env.NEXT_PUBLIC_SERVER_URL || 'NOT SET');
console.log('- NEXT_PUBLIC_CLIENT_URL:', process.env.NEXT_PUBLIC_CLIENT_URL || 'NOT SET');

console.log('\n🔒 CORS Configuration:');
console.log('- ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || 'NOT SET');

console.log('\n📤 Upload Configuration:');
console.log('- UPLOAD_PATH:', process.env.UPLOAD_PATH || 'NOT SET');

// Test database connection
console.log('\n🔍 Testing Database Connection...');
try {
  const { testConnection } = require('./server/db');
  testConnection()
    .then(() => {
      console.log('✅ Database connection successful!');
    })
    .catch((error) => {
      console.log('❌ Database connection failed:', error.message);
    });
} catch (error) {
  console.log('❌ Could not load database module:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETED');
console.log('='.repeat(60));