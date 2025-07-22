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

function logWithPrefix(prefix, message, color = 'reset') {
  console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
}

// Check if directories exist
const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

if (!fs.existsSync(serverDir)) {
  log('❌ Server directory not found!', 'red');
  process.exit(1);
}

if (!fs.existsSync(clientDir)) {
  log('❌ Client directory not found!', 'red');
  process.exit(1);
}

// Check if node_modules exist
const serverNodeModules = path.join(serverDir, 'node_modules');
const clientNodeModules = path.join(clientDir, 'node_modules');

if (!fs.existsSync(serverNodeModules)) {
  log('⚠️  Server dependencies not found. Installing...', 'yellow');
  const serverInstall = spawn('npm', ['install'], {
    cwd: serverDir,
    stdio: 'inherit',
    shell: true
  });
  
  serverInstall.on('close', (code) => {
    if (code !== 0) {
      log('❌ Failed to install server dependencies!', 'red');
      process.exit(1);
    }
    log('✅ Server dependencies installed!', 'green');
  });
}

if (!fs.existsSync(clientNodeModules)) {
  log('⚠️  Client dependencies not found. Installing...', 'yellow');
  const clientInstall = spawn('npm', ['install'], {
    cwd: clientDir,
    stdio: 'inherit',
    shell: true
  });
  
  clientInstall.on('close', (code) => {
    if (code !== 0) {
      log('❌ Failed to install client dependencies!', 'red');
      process.exit(1);
    }
    log('✅ Client dependencies installed!', 'green');
  });
}

log('🚀 Starting News Markaba VPS Environment...', 'cyan');
log('', 'reset');

// Start server
log('📡 Starting Node.js Server...', 'blue');
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

// Start client after dependencies check and delay
setTimeout(() => {
  log('🌐 Starting Next.js Client...', 'green');
  
  // Use production build for VPS
  const clientProcess = spawn('npm', ['run', 'build'], {
    cwd: clientDir,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  clientProcess.on('close', (buildCode) => {
    if (buildCode === 0) {
      log('✅ Client build completed. Starting production server...', 'green');
      
      const startProcess = spawn('npm', ['run', 'start'], {
        cwd: clientDir,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'production', PORT: '3000' }
      });
      
      startProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          logWithPrefix('CLIENT', output, 'green');
        }
      });

      startProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('warn')) {
          logWithPrefix('CLIENT', output, 'yellow');
        }
      });

      startProcess.on('close', (code) => {
        logWithPrefix('CLIENT', `Process exited with code ${code}`, 'red');
      });
      
      global.clientProcess = startProcess;
    } else {
      logWithPrefix('CLIENT', `Build failed with code ${buildCode}`, 'red');
    }
  });

  // Handle build output
  clientProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      logWithPrefix('CLIENT-BUILD', output, 'cyan');
    }
  });

  clientProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('warn')) {
      logWithPrefix('CLIENT-BUILD', output, 'yellow');
    }
  });
}, 5000);

// Handle server output
serverProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    logWithPrefix('SERVER', output, 'blue');
  }
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output && !output.includes('warn')) {
    logWithPrefix('SERVER', output, 'yellow');
  }
});

serverProcess.on('close', (code) => {
  logWithPrefix('SERVER', `Process exited with code ${code}`, 'red');
});

// Handle process termination
process.on('SIGINT', () => {
  log('\n🛑 Shutting down VPS environment...', 'yellow');
  
  if (global.clientProcess) {
    global.clientProcess.kill('SIGINT');
  }
  serverProcess.kill('SIGINT');
  
  setTimeout(() => {
    log('✅ VPS environment stopped.', 'green');
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  if (global.clientProcess) {
    global.clientProcess.kill('SIGTERM');
  }
  serverProcess.kill('SIGTERM');
});

// Display startup information
setTimeout(() => {
  log('', 'reset');
  log('🎉 VPS Environment Started!', 'bright');
  log('', 'reset');
  log('📍 Server URLs:', 'cyan');
  log('   • API: http://your-vps-ip:5000/api/v2', 'reset');
  log('   • Docs: http://your-vps-ip:5000/api-docs', 'reset');
  log('', 'reset');
  log('📍 Client URLs:', 'cyan');
  log('   • Website: http://your-vps-ip:3000', 'reset');
  log('', 'reset');
  log('💡 Press Ctrl+C to stop both servers', 'yellow');
  log('', 'reset');
}, 10000);