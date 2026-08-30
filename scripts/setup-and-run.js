#!/usr/bin/env node
/**
 * One command: ensure Node 18+, install packages if needed, start the site.
 * Works on Windows (PowerShell) and Unix.
 *
 *   npm run setup:node
 *   node scripts/setup-and-run.js
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');

function log(message) {
  console.log(message);
}

function runSync(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function hasModules(dir) {
  return fs.existsSync(path.join(dir, 'node_modules'));
}

const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
log('');
log('News Markaba — setup and run');
log(`Node ${process.version} / npm ${spawnSync('npm', ['-v'], { encoding: 'utf8', shell: true }).stdout.trim()}`);
log('');

if (nodeMajor < 18) {
  log('Node 18+ is required.');
  log('On Linux/macOS/WSL run:  bash scripts/setup-node.sh --node-only');
  log('Then run this command again.');
  process.exit(1);
}

if (!hasModules(rootDir) || !hasModules(clientDir) || !hasModules(serverDir)) {
  log('Installing packages (first run)...');
  if (!hasModules(rootDir)) {
    runSync('npm', ['install'], rootDir);
  }
  if (!hasModules(clientDir)) {
    runSync('npm', ['install'], clientDir);
  }
  if (!hasModules(serverDir)) {
    runSync('npm', ['install'], serverDir);
  }
  log('Packages installed.');
  log('');
} else {
  log('Packages already installed.');
}

if (!fs.existsSync(path.join(rootDir, '.env'))) {
  log('Missing .env — run:  bash scripts/setup-env.sh --domain localhost --yes');
  process.exit(1);
}

log('Starting website...');
log('  Site:  http://localhost:3000');
log('  API:   http://localhost:5000');
log('  Admin: http://localhost:3000/admin/administratorpage');
log('');

const child = spawn('npm', ['run', 'start-dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
