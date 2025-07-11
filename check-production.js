#!/usr/bin/env node

/**
 * Production Status Checker for News Markaba
 * This script checks if your production deployment is working correctly
 */

const http = require('http');
const https = require('https');

const PRODUCTION_IP = '69.62.115.12';
const API_PORT = '5000';
const WEB_PORT = '80';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = protocol.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;
      
      if (status >= 200 && status < 400) {
        log(`✅ ${description}: ${status} (${responseTime}ms)`, 'green');
        resolve({ success: true, status, responseTime });
      } else {
        log(`⚠️  ${description}: ${status} (${responseTime}ms)`, 'yellow');
        resolve({ success: false, status, responseTime });
      }
    }).on('error', (err) => {
      const responseTime = Date.now() - startTime;
      log(`❌ ${description}: ${err.message} (${responseTime}ms)`, 'red');
      resolve({ success: false, error: err.message, responseTime });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      log(`❌ ${description}: Timeout (10s)`, 'red');
      resolve({ success: false, error: 'Timeout', responseTime: 10000 });
    });
  });
}

async function checkProduction() {
  log('🔍 Checking News Markaba Production Deployment...', 'bold');
  log(`📍 Production Server: ${PRODUCTION_IP}`, 'blue');
  log('', 'reset');
  
  const checks = [
    {
      url: `http://${PRODUCTION_IP}`,
      description: 'Website (Port 80)'
    },
    {
      url: `http://${PRODUCTION_IP}:${API_PORT}/health`,
      description: 'API Health Check'
    },
    {
      url: `http://${PRODUCTION_IP}:${API_PORT}/api`,
      description: 'API Documentation'
    },
    {
      url: `http://${PRODUCTION_IP}:${API_PORT}/api/v2/posts`,
      description: 'Posts API'
    },
    {
      url: `http://${PRODUCTION_IP}:${API_PORT}/api/v2/categories`,
      description: 'Categories API'
    },
    {
      url: `http://${PRODUCTION_IP}:${API_PORT}/uploads`,
      description: 'Static Files (Uploads)'
    }
  ];
  
  const results = [];
  
  for (const check of checks) {
    const result = await checkEndpoint(check.url, check.description);
    results.push({ ...check, ...result });
    
    // Small delay between checks
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  log('', 'reset');
  log('📊 Summary:', 'bold');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  if (successful === total) {
    log(`🎉 All checks passed! (${successful}/${total})`, 'green');
    log('✅ Your News Markaba application is running correctly in production!', 'green');
  } else {
    log(`⚠️  ${successful}/${total} checks passed`, 'yellow');
    log('❌ Some services may not be running correctly', 'red');
  }
  
  log('', 'reset');
  log('🌐 Access URLs:', 'bold');
  log(`   Website: http://${PRODUCTION_IP}/`, 'blue');
  log(`   Admin Panel: http://${PRODUCTION_IP}/admin`, 'blue');
  log(`   API Documentation: http://${PRODUCTION_IP}:${API_PORT}/api`, 'blue');
  log(`   Health Check: http://${PRODUCTION_IP}:${API_PORT}/health`, 'blue');
  
  if (successful < total) {
    log('', 'reset');
    log('🔧 Troubleshooting:', 'bold');
    log('1. Check if PM2 processes are running: pm2 status', 'yellow');
    log('2. Check PM2 logs: pm2 logs', 'yellow');
    log('3. Restart services: pm2 restart all', 'yellow');
    log('4. Check firewall: ufw status', 'yellow');
    log('5. Check server resources: htop', 'yellow');
  }
}

// Run the check
checkProduction().catch(console.error);