#!/usr/bin/env node
/**
 * Quick Domain Update Script
 * Usage: node scripts/update-domain.js <domain> [server_port] [client_port] [protocol]
 * Example: node scripts/update-domain.js markaba.news 5001 443 https
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('\n🚀 News Markaba Domain Update Script');
  console.log('=====================================\n');
  console.log('Usage: node scripts/update-domain.js <domain> [server_port] [client_port] [protocol]\n');
  console.log('Examples:');
  console.log('  node scripts/update-domain.js markaba.news');
  console.log('  node scripts/update-domain.js markaba.news 5001 443 https');
  console.log('  node scripts/update-domain.js localhost 5001 3001 http\n');
  process.exit(1);
}

const domain = args[0];
const serverPort = args[1] || '5001';
const clientPort = args[2] || (domain === 'localhost' ? '3001' : '443');
const protocol = args[3] || (domain === 'localhost' ? 'http' : 'https');

// Path to environment config
const configPath = path.join(__dirname, '..', 'config', 'environment.js');

try {
  // Read the current config file
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Update the production configuration
  const productionConfigRegex = /production:\s*{[^}]*}/s;
  const newProductionConfig = `production: {
    DOMAIN: '${domain}',
    SERVER_PORT: ${serverPort},
    CLIENT_PORT: ${clientPort},
    PROTOCOL: '${protocol}'
  }`;
  
  configContent = configContent.replace(productionConfigRegex, newProductionConfig);
  
  // Write the updated config
  fs.writeFileSync(configPath, configContent, 'utf8');
  
  console.log('\n✅ Domain configuration updated successfully!\n');
  console.log('📋 New Configuration:');
  console.log('=====================');
  console.log(`Domain: ${domain}`);
  console.log(`Server Port: ${serverPort}`);
  console.log(`Client Port: ${clientPort}`);
  console.log(`Protocol: ${protocol}\n`);
  
  console.log('🌐 Generated URLs:');
  console.log('==================');
  const serverUrl = `${protocol}://${domain}:${serverPort}`;
  const clientUrl = clientPort === '80' || clientPort === '443' 
    ? `${protocol}://${domain}` 
    : `${protocol}://${domain}:${clientPort}`;
  
  console.log(`Client URL: ${clientUrl}`);
  console.log(`Server API: ${serverUrl}/api/v2`);
  console.log(`Upload URL: ${serverUrl}\n`);
  
  console.log('📝 Next Steps:');
  console.log('==============');
  if (domain !== 'localhost') {
    console.log('1. Set NODE_ENV=production on your server');
    console.log('2. Update database credentials in .env file');
    console.log('3. Set a strong JWT_SECRET in .env file');
    console.log('4. Deploy to your VPS');
    console.log('5. Start the application\n');
  } else {
    console.log('1. Start the development server');
    console.log('2. Access your application at the URLs above\n');
  }
  
} catch (error) {
  console.error('❌ Error updating domain configuration:', error.message);
  process.exit(1);
}