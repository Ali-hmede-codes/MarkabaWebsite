const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const net = require('net');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🔧 ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, (err) => {
      if (err) {
        resolve(false);
      } else {
        server.once('close', () => resolve(true));
        server.close();
      }
    });
    server.on('error', () => resolve(false));
  });
}

// Execute command and return promise
function execCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Main diagnostic function
async function diagnoseVPS() {
  log('🚀 News Markaba VPS Diagnostic & Fix Tool', 'bright');
  log('This tool will help identify and fix VPS deployment issues\n', 'cyan');

  // 1. Check environment
  logSection('Environment Check');
  try {
    const nodeVersion = await execCommand('node --version');
    log(`✅ Node.js: ${nodeVersion.stdout.trim()}`, 'green');
  } catch (e) {
    log('❌ Node.js not found or not working', 'red');
    return;
  }

  try {
    const npmVersion = await execCommand('npm --version');
    log(`✅ NPM: ${npmVersion.stdout.trim()}`, 'green');
  } catch (e) {
    log('❌ NPM not found or not working', 'red');
    return;
  }

  // 2. Check directories
  logSection('Directory Structure Check');
  const serverDir = path.join(__dirname, 'server');
  const clientDir = path.join(__dirname, 'client');
  
  try {
    await fs.access(serverDir);
    log('✅ Server directory exists', 'green');
  } catch (e) {
    log('❌ Server directory missing', 'red');
    return;
  }

  try {
    await fs.access(clientDir);
    log('✅ Client directory exists', 'green');
  } catch (e) {
    log('❌ Client directory missing', 'red');
    return;
  }

  // 3. Check dependencies
  logSection('Dependencies Check');
  try {
    await fs.access(path.join(serverDir, 'node_modules'));
    log('✅ Server dependencies installed', 'green');
  } catch (e) {
    log('⚠️  Server dependencies missing - installing...', 'yellow');
    try {
      await execCommand('npm install', serverDir);
      log('✅ Server dependencies installed successfully', 'green');
    } catch (installError) {
      log('❌ Failed to install server dependencies', 'red');
      log(installError.stderr, 'red');
    }
  }

  try {
    await fs.access(path.join(clientDir, 'node_modules'));
    log('✅ Client dependencies installed', 'green');
  } catch (e) {
    log('⚠️  Client dependencies missing - installing...', 'yellow');
    try {
      await execCommand('npm install', clientDir);
      log('✅ Client dependencies installed successfully', 'green');
    } catch (installError) {
      log('❌ Failed to install client dependencies', 'red');
      log(installError.stderr, 'red');
    }
  }

  // 4. Check environment files
  logSection('Environment Configuration Check');
  try {
    const envContent = await fs.readFile('.env.production', 'utf8');
    log('✅ .env.production file exists', 'green');
    
    // Check for required variables
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
    const missingVars = [];
    
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`, 'yellow');
    } else {
      log('✅ All required environment variables present', 'green');
    }
  } catch (e) {
    log('❌ .env.production file missing', 'red');
    log('Creating basic .env.production file...', 'yellow');
    
    const basicEnv = `# Production Environment Configuration
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=news_site
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://your_vps_ip
BACKEND_URL=http://your_vps_ip:5000
ALLOWED_ORIGINS=http://your_vps_ip,http://your_vps_ip:3000
`;
    
    try {
      await fs.writeFile('.env.production', basicEnv);
      log('✅ Basic .env.production file created', 'green');
      log('⚠️  Please edit .env.production with your actual values', 'yellow');
    } catch (writeError) {
      log('❌ Failed to create .env.production file', 'red');
    }
  }

  // 5. Check ports
  logSection('Port Availability Check');
  const port5000Available = await checkPort(5000);
  const port3000Available = await checkPort(3000);
  
  if (port5000Available) {
    log('✅ Port 5000 is available', 'green');
  } else {
    log('❌ Port 5000 is in use', 'red');
    try {
      const result = await execCommand('lsof -ti:5000 || netstat -tulpn | grep :5000');
      log(`Process using port 5000: ${result.stdout}`, 'yellow');
    } catch (e) {
      log('Could not identify process using port 5000', 'yellow');
    }
  }
  
  if (port3000Available) {
    log('✅ Port 3000 is available', 'green');
  } else {
    log('❌ Port 3000 is in use', 'red');
  }

  // 6. Test database connection
  logSection('Database Connection Test');
  try {
    const dbTest = await execCommand('node -e "require(\'./server/db\').testConnection().then(() => console.log(\'OK\')).catch(e => { console.error(e.message); process.exit(1); })"');
    log('✅ Database connection successful', 'green');
  } catch (e) {
    log('❌ Database connection failed', 'red');
    log('Error: ' + e.stderr, 'red');
    log('\n🔧 Database troubleshooting steps:', 'yellow');
    log('1. Check if MySQL/MariaDB is running', 'reset');
    log('2. Verify database credentials in .env.production', 'reset');
    log('3. Ensure database exists and user has permissions', 'reset');
    log('4. Check firewall settings for database port', 'reset');
  }

  // 7. Build client
  logSection('Client Build Test');
  try {
    log('Building Next.js client...', 'yellow');
    const buildResult = await execCommand('npm run build', clientDir);
    log('✅ Client build successful', 'green');
  } catch (e) {
    log('❌ Client build failed', 'red');
    log('Build error:', 'red');
    log(e.stderr, 'red');
  }

  // 8. Firewall check
  logSection('Firewall & Network Check');
  try {
    const ufwStatus = await execCommand('ufw status');
    log('UFW Status:', 'yellow');
    log(ufwStatus.stdout, 'reset');
  } catch (e) {
    log('Could not check UFW status (may not be installed)', 'yellow');
  }

  // 9. System resources
  logSection('System Resources Check');
  try {
    const memInfo = await execCommand('free -h');
    log('Memory Usage:', 'yellow');
    log(memInfo.stdout, 'reset');
  } catch (e) {
    log('Could not check memory usage', 'yellow');
  }

  try {
    const diskInfo = await execCommand('df -h');
    log('\nDisk Usage:', 'yellow');
    log(diskInfo.stdout, 'reset');
  } catch (e) {
    log('Could not check disk usage', 'yellow');
  }

  // 10. Recommendations
  logSection('Recommendations & Next Steps');
  log('\n🔧 To fix VPS deployment issues:', 'bright');
  log('\n1. Server Configuration:', 'cyan');
  log('   • Ensure server binds to 0.0.0.0 (already fixed)', 'green');
  log('   • Set NODE_ENV=production', 'reset');
  log('   • Configure proper CORS origins', 'reset');
  
  log('\n2. Firewall Configuration:', 'cyan');
  log('   • sudo ufw allow 5000', 'reset');
  log('   • sudo ufw allow 3000', 'reset');
  log('   • sudo ufw allow 80', 'reset');
  log('   • sudo ufw allow 443', 'reset');
  
  log('\n3. Process Management:', 'cyan');
  log('   • Install PM2: npm install -g pm2', 'reset');
  log('   • Start with PM2: pm2 start ecosystem.config.js', 'reset');
  log('   • Save PM2 config: pm2 save && pm2 startup', 'reset');
  
  log('\n4. Database Setup:', 'cyan');
  log('   • Ensure MySQL is running: sudo systemctl start mysql', 'reset');
  log('   • Create database and user with proper permissions', 'reset');
  log('   • Update .env.production with correct credentials', 'reset');
  
  log('\n5. Testing:', 'cyan');
  log('   • Test API: curl http://your_vps_ip:5000/health', 'reset');
  log('   • Test frontend: curl http://your_vps_ip:5000', 'reset');
  log('   • Check logs: pm2 logs', 'reset');

  log('\n🚀 Quick Start Commands:', 'bright');
  log('   • Start production: npm run start-vps', 'green');
  log('   • Start with PM2: pm2 start ecosystem.config.js', 'green');
  log('   • Check status: pm2 status', 'green');
  log('   • View logs: pm2 logs', 'green');
}

// Run diagnostics
diagnoseVPS().catch(error => {
  log('\n❌ Diagnostic failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});