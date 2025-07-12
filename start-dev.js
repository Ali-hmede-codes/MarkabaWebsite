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

log('🚀 Starting News Markaba Development Environment...', 'cyan');
log('', 'reset');

// Start server
log('📡 Starting Node.js Server...', 'blue');
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'pipe',
  shell: true
});

// Start client after a short delay
setTimeout(() => {
  log('🌐 Starting Next.js Client...', 'green');
  const clientProcess = spawn('npm', ['run', 'dev'], {
    cwd: clientDir,
    stdio: 'pipe',
    shell: true
  });

  // Handle client output
  clientProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      logWithPrefix('CLIENT', output, 'green');
    }
  });

  clientProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('warn')) {
      logWithPrefix('CLIENT', output, 'yellow');
    }
  });

  clientProcess.on('close', (code) => {
    logWithPrefix('CLIENT', `Process exited with code ${code}`, 'red');
  });

  // Store client process for cleanup
  global.clientProcess = clientProcess;
}, 3000);

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
  log('\n🛑 Shutting down development environment...', 'yellow');
  
  if (global.clientProcess) {
    global.clientProcess.kill('SIGINT');
  }
  serverProcess.kill('SIGINT');
  
  setTimeout(() => {
    log('✅ Development environment stopped.', 'green');
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
  log('🎉 Development Environment Started!', 'bright');
  log('', 'reset');
  log('📍 Server URLs:', 'cyan');
  log('   • API: http://69.62.115.12:5000/api/v2', 'reset');
  log('   • Docs: http://69.62.115.12:5000/api-docs', 'reset');
  log('', 'reset');
  log('📍 Client URLs:', 'cyan');
  log('   • Website: http://localhost:3000 (or 3001 if 3000 is busy)', 'reset');
  log('', 'reset');
  log('💡 Press Ctrl+C to stop both servers', 'yellow');
  log('', 'reset');
}, 5000);