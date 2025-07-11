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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDirectoryExists(dir) {
  return fs.existsSync(dir);
}

function checkNodeModules(dir) {
  return fs.existsSync(path.join(dir, 'node_modules'));
}

async function buildClient() {
  return new Promise((resolve, reject) => {
    log('🔨 Building Next.js client...', 'yellow');
    
    const clientDir = path.join(__dirname, 'client');
    
    if (!checkDirectoryExists(clientDir)) {
      log('❌ Client directory not found!', 'red');
      reject(new Error('Client directory not found'));
      return;
    }
    
    if (!checkNodeModules(clientDir)) {
      log('📦 Installing client dependencies...', 'cyan');
      const installProcess = spawn('npm', ['install'], {
        cwd: clientDir,
        stdio: 'inherit',
        shell: true
      });
      
      installProcess.on('close', (code) => {
        if (code !== 0) {
          log('❌ Failed to install client dependencies', 'red');
          reject(new Error('Failed to install client dependencies'));
          return;
        }
        
        // After installing, build the client
        buildClientAfterInstall(clientDir, resolve, reject);
      });
    } else {
      buildClientAfterInstall(clientDir, resolve, reject);
    }
  });
}

function buildClientAfterInstall(clientDir, resolve, reject) {
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: clientDir,
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      log('✅ Client built successfully!', 'green');
      resolve();
    } else {
      log('❌ Failed to build client', 'red');
      reject(new Error('Failed to build client'));
    }
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    log('🚀 Starting backend server...', 'blue');
    
    const serverDir = path.join(__dirname, 'server');
    
    if (!checkDirectoryExists(serverDir)) {
      log('❌ Server directory not found!', 'red');
      reject(new Error('Server directory not found'));
      return;
    }
    
    if (!checkNodeModules(serverDir)) {
      log('📦 Installing server dependencies...', 'cyan');
      const installProcess = spawn('npm', ['install'], {
        cwd: serverDir,
        stdio: 'inherit',
        shell: true
      });
      
      installProcess.on('close', (code) => {
        if (code !== 0) {
          log('❌ Failed to install server dependencies', 'red');
          reject(new Error('Failed to install server dependencies'));
          return;
        }
        
        // After installing, start the server
        startServerAfterInstall(serverDir, resolve, reject);
      });
    } else {
      startServerAfterInstall(serverDir, resolve, reject);
    }
  });
}

function startServerAfterInstall(serverDir, resolve, reject) {
  const serverProcess = spawn('npm', ['start'], {
    cwd: serverDir,
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      log('❌ Server exited with error', 'red');
      reject(new Error('Server failed'));
    }
  });
  
  // Don't resolve immediately, let the server run
  setTimeout(() => {
    log('✅ Server started successfully!', 'green');
    resolve(serverProcess);
  }, 3000);
}

async function main() {
  try {
    log('🌟 Starting News Markaba with Frontend Integration...', 'bright');
    log('=' .repeat(60), 'cyan');
    
    // Step 1: Build the client
    await buildClient();
    
    log('\n' + '=' .repeat(60), 'cyan');
    
    // Step 2: Start the server (which will now serve the frontend)
    const serverProcess = await startServer();
    
    log('\n' + '🎉 News Markaba is ready!', 'green');
    log('=' .repeat(60), 'cyan');
    log('🌐 Website: http://localhost:5000', 'bright');
    log('📚 API Docs: http://localhost:5000/api', 'bright');
    log('💚 Health Check: http://localhost:5000/health', 'bright');
    log('=' .repeat(60), 'cyan');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down...', 'yellow');
      if (serverProcess && serverProcess.kill) {
        serverProcess.kill('SIGINT');
      }
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('\n🛑 Shutting down...', 'yellow');
      if (serverProcess && serverProcess.kill) {
        serverProcess.kill('SIGTERM');
      }
      process.exit(0);
    });
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Start the application
main();