# Domain Setup Guide for markaba.news

This guide will help you set up your News Markaba project on your VPS with the domain `markaba.news` without exposing ports.

## 📋 Prerequisites
- VPS with Ubuntu/CentOS
- Domain `markaba.news` purchased
- SSH access to your VPS
- Nginx installed on your VPS

## 🌐 Step 1: Configure Domain DNS

1. **Point your domain to your VPS IP:**
   - Go to your domain registrar's DNS management
   - Add these DNS records:
     ```
     Type: A
     Name: @
     Value: 69.62.115.12
     TTL: 3600
     
     Type: A
     Name: www
     Value: 69.62.115.12
     TTL: 3600
     ```

2. **Wait for DNS propagation (5-48 hours)**
   - Test with: `nslookup markaba.news`

## 🚀 Step 2: Upload Files to VPS

**Option 1: Git Clone (Recommended for old-version02 branch):**
```bash
# SSH into your VPS first
ssh root@69.62.115.12

# Clone the specific branch
git clone -b old-version02 <your-repo-url> /var/www/MarkabaWebsite
```

**Option 2: Upload your project files:**
```bash
# From your local machine
scp -r d:/NewsMarkaba root@69.62.115.12:/var/www/MarkabaWebsite
```

**Option 3: Use FTP/SFTP client like FileZilla:**
- Upload the entire project folder to `/var/www/MarkabaWebsite`

## ⚙️ Step 3: Install Dependencies on VPS

1. **SSH into your VPS:**
   ```bash
   ssh root@69.62.115.12
   ```

2. **Install Node.js and npm:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install project dependencies:**
   ```bash
   cd /var/www/MarkabaWebsite/server
   npm install
   
   cd /var/www/MarkabaWebsite/client
   npm install
   ```

4. **Build the frontend:**
   ```bash
   cd /var/www/MarkabaWebsite/client
   npm run build
   ```

## 🔧 Step 4: Configure Nginx

1. **Copy the Nginx configuration:**
   ```bash
   sudo cp /var/www/MarkabaWebsite/markaba-news-nginx.conf /etc/nginx/sites-available/markaba.news
   ```

2. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/markaba.news /etc/nginx/sites-enabled/
   ```

3. **Remove default site (if exists):**
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

4. **Test Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

5. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   sudo systemctl restart nginx
   ```

## 🗄️ Step 5: Setup Database

1. **Import your database:**
   ```bash
   mysql -u admin -p markabadatabase < /var/www/MarkabaWebsite/database_backup.sql
   ```

2. **Verify database connection:**
   ```bash
   cd /var/www/MarkabaWebsite/server
   node -e "require('./config/database.js').testConnection()"
   ```

## 🔄 Step 6: Setup Process Management

1. **Install PM2 for process management:**
   ```bash
   sudo npm install -g pm2
   ```

2. **Create PM2 ecosystem file:**
   ```bash
   cat > /var/www/MarkabaWebsite/ecosystem.config.js << 'EOF'
   module.exports = {
     apps: [
       {
         name: 'markaba-backend',
         script: './server/index.js',
         cwd: '/var/www/MarkabaWebsite',
         env: {
           NODE_ENV: 'production',
           PORT: 5000
         },
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: '1G'
       },
       {
         name: 'markaba-frontend',
         script: 'npm',
         args: 'start',
         cwd: '/var/www/MarkabaWebsite/client',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         },
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: '1G'
       }
     ]
   };
   EOF
   ```

3. **Start applications with PM2:**
   ```bash
   cd /var/www/MarkabaWebsite
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## 🔒 Step 7: Setup SSL (Optional but Recommended)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d markaba.news -d www.markaba.news
   ```

3. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## 🧪 Step 8: Test Your Setup

1. **Test the website:**
   ```bash
   curl -I https://markaba.news
   ```

2. **Test API:**
   ```bash
   curl -I https://markaba.news/api/health
   ```

3. **Test uploads:**
   ```bash
   curl -I https://markaba.news/uploads/general/test.jpg
   ```

## 🔍 Step 9: Monitor and Troubleshoot

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs
   ```

2. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. **Check application logs:**
   ```bash
   pm2 logs markaba-backend
   pm2 logs markaba-frontend
   ```

## 🎯 Final Result

After completing these steps:
- ✅ Your website will be accessible at `https://markaba.news`
- ✅ No ports will be visible to users
- ✅ CORS issues will be resolved
- ✅ SSL encryption will be enabled
- ✅ Both frontend and backend will run automatically

## 🚨 Important Notes

1. **Firewall Settings:**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw enable
   ```

2. **File Permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/MarkabaWebsite
   sudo chmod -R 755 /var/www/MarkabaWebsite
   ```

3. **Environment Variables:**
   - All environment variables are already updated to use `markaba.news`
   - No manual changes needed

## 📞 Support

If you encounter any issues:
1. Check the logs mentioned in Step 9
2. Verify DNS propagation
3. Ensure all services are running with `pm2 status`
4. Test Nginx configuration with `sudo nginx -t`

Your News Markaba website will be live at `https://markaba.news` without any visible ports!