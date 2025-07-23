#!/bin/bash

# News Markaba Deployment Script for markaba.news
# This script automates the deployment process on your VPS

set -e  # Exit on any error

echo "🚀 Starting News Markaba deployment for markaba.news..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/MarkabaWebsite"
NGINX_SITE="markaba.news"
DOMAIN="markaba.news"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    apt install -y nginx
else
    print_status "Nginx already installed"
fi

# Install MySQL if not installed
if ! command -v mysql &> /dev/null; then
    print_status "Installing MySQL..."
    apt install -y mysql-server
    mysql_secure_installation
else
    print_status "MySQL already installed"
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
else
    print_status "PM2 already installed: $(pm2 --version)"
fi

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    print_status "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
fi

# Set proper ownership and permissions
print_status "Setting file permissions..."
chown -R www-data:www-data "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"

# Install backend dependencies
if [ -d "$PROJECT_DIR/server" ]; then
    print_status "Installing backend dependencies..."
    cd "$PROJECT_DIR/server"
    npm install --production
fi

# Install frontend dependencies and build
if [ -d "$PROJECT_DIR/client" ]; then
    print_status "Installing frontend dependencies..."
    cd "$PROJECT_DIR/client"
    npm install
    
    print_status "Building frontend..."
    npm run build
fi

# Configure Nginx
print_status "Configuring Nginx..."
if [ -f "$PROJECT_DIR/markaba-news-nginx.conf" ]; then
    cp "$PROJECT_DIR/markaba-news-nginx.conf" "/etc/nginx/sites-available/$NGINX_SITE"
    
    # Enable the site
    ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/"
    
    # Remove default site if it exists
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        rm "/etc/nginx/sites-enabled/default"
    fi
    
    # Test Nginx configuration
    if nginx -t; then
        print_status "Nginx configuration is valid"
        systemctl reload nginx
        systemctl restart nginx
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
else
    print_error "Nginx configuration file not found"
    exit 1
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p "$PROJECT_DIR/logs"
chown -R www-data:www-data "$PROJECT_DIR/logs"

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Start applications with PM2
print_status "Starting applications with PM2..."
cd "$PROJECT_DIR"
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
else
    print_error "PM2 ecosystem file not found"
    exit 1
fi

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22   # SSH
ufw allow 80   # HTTP
ufw allow 443  # HTTPS

# Install and configure SSL with Let's Encrypt
if command -v certbot &> /dev/null; then
    print_status "Certbot already installed"
else
    print_status "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
fi

print_status "Setting up SSL certificate..."
print_warning "Make sure your domain $DOMAIN is pointing to this server before proceeding"
read -p "Do you want to install SSL certificate now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
fi

# Final status check
print_status "Checking service status..."
echo "Nginx status:"
systemctl status nginx --no-pager -l

echo "\nPM2 status:"
pm2 status

echo "\nFirewall status:"
ufw status

print_status "Deployment completed successfully! 🎉"
print_status "Your website should be accessible at:"
print_status "HTTP: http://$DOMAIN"
print_status "HTTPS: https://$DOMAIN (if SSL was configured)"

print_warning "Important next steps:"
echo "1. Verify your domain DNS is pointing to this server"
echo "2. If using Git, clone the old-version02 branch: git clone -b old-version02 <your-repo-url> /var/www/MarkabaWebsite"
echo "3. Test your website: curl -I https://$DOMAIN"
echo "4. Check PM2 logs: pm2 logs"
echo "5. Check Nginx logs: tail -f /var/log/nginx/error.log"

print_status "Deployment script finished!"