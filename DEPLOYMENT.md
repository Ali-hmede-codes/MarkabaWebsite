# 🚀 News Markaba Production Deployment Guide

This guide will help you deploy your News Markaba project to your production server at `http://69.62.115.12/`.

## 📋 Prerequisites

### On Your Production Server (69.62.115.12):
- Node.js (v16 or higher)
- npm
- MySQL/MariaDB
- PM2 (Process Manager)
- Git (optional, for easier updates)

## 🛠️ Quick Deployment Steps

### 1. Prepare for Production (Run on your local machine)

```bash
# Run the deployment preparation script
node deploy-production.js
```

This script will:
- ✅ Backup your current environment files
- ✅ Copy production configurations
- ✅ Build the client for production
- ✅ Install production dependencies

### 2. Upload to Your Server

Upload the entire project folder to your server:

```bash
# Using SCP (replace with your actual path)
scp -r NewsMarkaba/ root@69.62.115.12:/var/www/

# Or using SFTP/FTP client
# Upload to: /var/www/NewsMarkaba/
```

### 3. Server Setup

SSH into your server and run:

```bash
# Connect to your server
ssh root@69.62.115.12

# Navigate to project directory
cd /var/www/NewsMarkaba

# Install PM2 globally
npm install -g pm2

# Install serve for static files
npm install -g serve

# Create logs directory
mkdir -p logs

# Set up database (if not already done)
mysql -u root -p < sql/create_tables.sql
```

### 4. Start Services with PM2

```bash
# Start both API and Web services
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration for auto-restart on reboot
pm2 save
pm2 startup
```

## 🌐 Access Your Application

- **Website**: http://69.62.115.12/
- **API**: http://69.62.115.12:5000/api
- **Admin Panel**: http://69.62.115.12/admin
- **Health Check**: http://69.62.115.12:5000/health

## 🔧 Configuration Files Created

### Production Environment Files:
- `.env.production` - Server environment variables
- `client/.env.production` - Client environment variables
- `ecosystem.config.js` - PM2 process configuration
- `deploy-production.js` - Deployment automation script

### Key Configuration Changes:
- ✅ API URLs point to `http://69.62.115.12:5000`
- ✅ CORS configured for production domain
- ✅ Production environment variables set
- ✅ Static file serving optimized

## 🔒 Security Considerations

### Before Going Live:
1. **Change JWT Secret**: Update `JWT_SECRET` in `.env.production`
2. **Secure Database**: Change default database password
3. **Firewall**: Configure firewall to allow only necessary ports
4. **SSL Certificate**: Consider adding HTTPS with Let's Encrypt
5. **Backup Strategy**: Set up automated database backups

### Recommended Firewall Rules:
```bash
# Allow SSH
ufw allow 22

# Allow HTTP
ufw allow 80

# Allow API port
ufw allow 5000

# Enable firewall
ufw enable
```

## 📊 Monitoring & Maintenance

### PM2 Commands:
```bash
# Check status
pm2 status

# View logs
pm2 logs news-markaba-api
pm2 logs news-markaba-web

# Restart services
pm2 restart news-markaba-api
pm2 restart news-markaba-web

# Stop services
pm2 stop all

# Monitor in real-time
pm2 monit
```

### Database Backup:
```bash
# Create backup
mysqldump -u root -p markabadatabase > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p markabadatabase < backup_file.sql
```

## 🔄 Updates & Maintenance

### To Update Your Application:
1. Make changes locally
2. Run `node deploy-production.js`
3. Upload changed files to server
4. Restart PM2 processes: `pm2 restart all`

### Log Rotation:
PM2 automatically handles log rotation, but you can also set up logrotate:

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure (optional)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🆘 Troubleshooting

### Common Issues:

1. **Port Already in Use**:
   ```bash
   # Find process using port
   netstat -tulpn | grep :5000
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Failed**:
   - Check MySQL service: `systemctl status mysql`
   - Verify credentials in `.env.production`
   - Test connection: `mysql -u root -p`

3. **Permission Issues**:
   ```bash
   # Fix file permissions
   chown -R www-data:www-data /var/www/NewsMarkaba
   chmod -R 755 /var/www/NewsMarkaba
   ```

4. **CORS Errors**:
   - Verify domain in server CORS configuration
   - Check browser developer tools for exact error

### Getting Help:
- Check PM2 logs: `pm2 logs`
- Check system logs: `journalctl -f`
- Monitor resources: `htop` or `pm2 monit`

## 📞 Support

If you encounter issues:
1. Check the logs first: `pm2 logs`
2. Verify all services are running: `pm2 status`
3. Test API health: `curl http://69.62.115.12:5000/health`
4. Check database connectivity

---

**🎉 Congratulations!** Your News Markaba application should now be running in production at `http://69.62.115.12/`