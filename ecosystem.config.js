const path = require('path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'markaba-backend',
      script: path.join(root, 'server', 'index.js'),
      cwd: root,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      time: true,
      env_file: path.join(root, '.env'),
      error_file: path.join(root, 'logs', 'backend-error.log'),
      out_file: path.join(root, 'logs', 'backend-out.log'),
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'markaba-frontend',
      script: path.join(root, 'scripts', 'start-frontend-prod.js'),
      cwd: path.join(root, 'client'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      watch: false,
      max_memory_restart: '1G',
      time: true,
      error_file: path.join(root, 'logs', 'frontend-error.log'),
      out_file: path.join(root, 'logs', 'frontend-out.log'),
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
