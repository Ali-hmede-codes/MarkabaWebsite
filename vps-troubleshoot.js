const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing: ${filePath}`, 'red');
    return false;
  }
}

function runCommand(command, cwd = __dirname) {
  return new Promise((resolve) => {
    const process = spawn(command.split(' ')[0], command.split(' ').slice(1), {
      cwd,
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      resolve({ code, output: output.trim() });
    });
  });
}

async function troubleshoot() {
  log('🔍 VPS Troubleshooting Script', 'cyan');
  log('================================', 'cyan');
  log('');
  
  // Check Node.js version
  log('📋 System Information:', 'blue');
  const nodeVersion = await runCommand('node --version');
  log(`   Node.js: ${nodeVersion.output}`, nodeVersion.code === 0 ? 'green' : 'red');
  
  const npmVersion = await runCommand('npm --version');
  log(`   NPM: ${npmVersion.output}`, npmVersion.code === 0 ? 'green' : 'red');
  
  log('');
  
  // Check directories
  log('📁 Directory Structure:', 'blue');
  checkFile(path.join(__dirname, 'server'), 'Server directory');
  checkFile(path.join(__dirname, 'client'), 'Client directory');
  checkFile(path.join(__dirname, 'server', 'package.json'), 'Server package.json');
  checkFile(path.join(__dirname, 'client', 'package.json'), 'Client package.json');
  
  log('');
  
  // Check dependencies
  log('📦 Dependencies:', 'blue');
  const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
  const clientNodeModules = path.join(__dirname, 'client', 'node_modules');
  
  if (checkFile(serverNodeModules, 'Server node_modules')) {
    const serverPackages = fs.readdirSync(serverNodeModules).length;
    log(`   Server packages: ${serverPackages}`, 'green');
  }
  
  if (checkFile(clientNodeModules, 'Client node_modules')) {
    const clientPackages = fs.readdirSync(clientNodeModules).length;
    log(`   Client packages: ${clientPackages}`, 'green');
  }
  
  log('');
  
  // Check environment files
  log('🌍 Environment Files:', 'blue');
  checkFile(path.join(__dirname, '.env'), 'Root .env');
  checkFile(path.join(__dirname, '.env.production'), 'Root .env.production');
  checkFile(path.join(__dirname, 'server', '.env'), 'Server .env');
  checkFile(path.join(__dirname, 'client', '.env.local'), 'Client .env.local');
  checkFile(path.join(__dirname, 'client', '.env.production'), 'Client .env.production');
  
  log('');
  
  // Check ports
  log('🔌 Port Check:', 'blue');
  const portCheck = await runCommand('netstat -tulpn');
  if (portCheck.output.includes(':5000')) {
    log('   ⚠️  Port 5000 is in use', 'yellow');
  } else {
    log('   ✅ Port 5000 is available', 'green');
  }
  
  if (portCheck.output.includes(':3000')) {
    log('   ⚠️  Port 3000 is in use', 'yellow');
  } else {
    log('   ✅ Port 3000 is available', 'green');
  }
  
  log('');
  
  // Test builds
  log('🔨 Build Test:', 'blue');
  log('   Testing client build...', 'yellow');
  
  const clientBuild = await runCommand('npm run build', path.join(__dirname, 'client'));
  if (clientBuild.code === 0) {
    log('   ✅ Client build successful', 'green');
  } else {
    log('   ❌ Client build failed:', 'red');
    log(`   ${clientBuild.output.slice(-200)}`, 'red');
  }
  
  log('');
  
  // Recommendations
  log('💡 Recommendations:', 'cyan');
  
  if (!fs.existsSync(serverNodeModules)) {
    log('   • Run: cd server && npm install', 'yellow');
  }
  
  if (!fs.existsSync(clientNodeModules)) {
    log('   • Run: cd client && npm install', 'yellow');
  }
  
  if (nodeVersion.output && parseFloat(nodeVersion.output.replace('v', '')) < 18) {
    log('   • Upgrade Node.js to version 18 or higher', 'yellow');
  }
  
  log('   • Use: npm run start-vps (for VPS deployment)', 'green');
  log('   • Use: npm run start-dev (for local development)', 'green');
  
  log('');
  log('🎯 Troubleshooting Complete!', 'cyan');
}

troubleshoot().catch(console.error);