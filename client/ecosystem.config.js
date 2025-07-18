module.exports = {
  apps: [
    {
      name: 'newsmarkaba-frontend',
      script: 'npm',
      args: 'run start',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        // Add other .env variables here if needed
      }
    }
  ]
};