#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '..', 'client');
const buildId = path.join(clientDir, '.next', 'BUILD_ID');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: clientDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(buildId)) {
  console.log('No production build found. Running next build...');
  run('npm', ['run', 'build']);
}

run('npx', ['next', 'start', '-p', process.env.PORT || '3000']);
