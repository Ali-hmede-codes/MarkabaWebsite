module.exports = {
  apps: [
    {
      name: 'newsmarkaba-frontend',
      script: 'npm',
      args: 'run dev',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        // Add other .env variables here if needed
      }
    }
  ]
};