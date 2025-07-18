module.exports = {
  apps: [
    {
      name: 'newsmarkaba-frontend',
      script: 'npm',
      args: 'start',
      cwd: 'd:\\NewsMarkaba\\client',
      instances: 'max', // Or specify a number for clustering
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        // Add other .env variables here if needed
      }
    }
  ]
};