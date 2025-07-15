# VPS Deployment Fix Guide

## Issue Identified
The "Incorrect arguments to mysqld_stmt_execute" error was caused by a parameter mismatch in the SQL query execution in the posts route. This has been fixed in the local version.

## Steps to Deploy the Fix to Your VPS

### 1. Upload the Fixed Files to Your VPS
You need to upload the updated `posts_combined.js` file to your VPS:

```bash
# On your VPS, navigate to your project directory
cd /path/to/your/newsmarkaba/project

# Backup the current file
cp server/routes/posts_combined.js server/routes/posts_combined.js.backup

# Upload the new file (use SCP, SFTP, or your preferred method)
# Replace the posts_combined.js file with the fixed version
```

### 2. Restart the Server on VPS
```bash
# If using PM2 (recommended)
pm2 restart all

# Or if running directly with node
pkill -f "node server/index.js"
node server/index.js

# Or if using systemd service
sudo systemctl restart newsmarkaba
```

### 3. Test the API on VPS
```bash
# Test the API endpoint
curl -X GET "http://69.62.115.12:5000/api/v2/posts" -H "Content-Type: application/json"

# Should return JSON with posts data instead of the error
```

### 4. Alternative: Complete Redeployment
If you want to ensure everything is up to date:

```bash
# On your VPS
git pull origin main  # or your branch name
npm install
pm2 restart all
```

## What Was Fixed

The issue was in the `posts_combined.js` file where the count query was using a regex replacement that caused parameter mismatches. The fix:

1. **Before**: Used regex to modify the main query for counting
2. **After**: Built a separate, properly parameterized count query

This ensures that the number of parameters matches exactly between the query string and the parameters array.

## Verification

After deployment, verify these endpoints work:
- `http://69.62.115.12:5000/api/v2/posts`
- `http://69.62.115.12:5000/api/v2/categories`
- `http://69.62.115.12:5000/api/v2/breaking-news`
- `http://69.62.115.12:5000/api/v2/settings/public`

All should return JSON responses instead of 500 errors.

## Additional Recommendations

1. **Enable Error Logging**: Add proper error logging to catch future issues
2. **Database Connection Monitoring**: Ensure MySQL connection is stable
3. **Use PM2**: For better process management and auto-restart
4. **Set up Health Checks**: Monitor the `/health` endpoint

## PM2 Configuration (Recommended)

Create a `ecosystem.config.js` file:

```javascript
module.exports = {
  apps: [{
    name: 'newsmarkaba-server',
    script: 'server/index.js',
    cwd: '/path/to/your/project',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
```

Then run: `pm2 start ecosystem.config.js`