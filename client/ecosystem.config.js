module.exports = {
  apps: [
    {
      name: 'newsmarkaba-frontend',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      cwd: 'd:\\NewsMarkaba\\client',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        // Add other .env variables here if needed
      }
    }
  ]
};