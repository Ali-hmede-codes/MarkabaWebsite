#!/bin/bash

# Test Domain Setup Script
# This script helps test the domain configuration locally before VPS deployment

echo "🧪 Testing News Markaba domain setup..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test 1: Check DNS resolution
print_status "Testing DNS resolution for markaba.news..."
if nslookup markaba.news | grep -q "69.62.115.12"; then
    print_status "✅ DNS is correctly pointing to your VPS"
else
    print_warning "⚠️  DNS might not be propagated yet or not configured"
    echo "Expected IP: 69.62.115.12"
    echo "Current resolution:"
    nslookup markaba.news || echo "Domain not resolved"
fi

# Test 2: Check if domain is reachable
print_status "Testing domain connectivity..."
if curl -s --connect-timeout 5 http://markaba.news > /dev/null 2>&1; then
    print_status "✅ Domain is reachable via HTTP"
else
    print_warning "⚠️  Domain not reachable via HTTP yet"
fi

if curl -s --connect-timeout 5 https://markaba.news > /dev/null 2>&1; then
    print_status "✅ Domain is reachable via HTTPS"
else
    print_warning "⚠️  Domain not reachable via HTTPS (SSL not configured yet)"
fi

# Test 3: Check local configuration files
print_status "Checking local configuration files..."

# Check server .env
if [ -f "server/.env" ]; then
    if grep -q "markaba.news" server/.env; then
        print_status "✅ Server .env updated with domain"
    else
        print_error "❌ Server .env not updated with domain"
    fi
else
    print_error "❌ Server .env file not found"
fi

# Check client .env.local
if [ -f "client/.env.local" ]; then
    if grep -q "markaba.news" client/.env.local; then
        print_status "✅ Client .env.local updated with domain"
    else
        print_error "❌ Client .env.local not updated with domain"
    fi
else
    print_error "❌ Client .env.local file not found"
fi

# Check Nginx config
if [ -f "markaba-news-nginx.conf" ]; then
    print_status "✅ Nginx configuration file exists"
else
    print_error "❌ Nginx configuration file not found"
fi

# Check PM2 ecosystem
if [ -f "ecosystem.config.js" ]; then
    print_status "✅ PM2 ecosystem configuration exists"
else
    print_error "❌ PM2 ecosystem configuration not found"
fi

# Test 4: Validate configuration syntax
print_status "Validating configuration files..."

# Test PM2 config syntax
if [ -f "ecosystem.config.js" ]; then
    if node -c ecosystem.config.js 2>/dev/null; then
        print_status "✅ PM2 ecosystem config syntax is valid"
    else
        print_error "❌ PM2 ecosystem config has syntax errors"
    fi
fi

# Test 5: Check required dependencies
print_status "Checking dependencies..."

if [ -d "server/node_modules" ]; then
    print_status "✅ Server dependencies installed"
else
    print_warning "⚠️  Server dependencies not installed (run: cd server && npm install)"
fi

if [ -d "client/node_modules" ]; then
    print_status "✅ Client dependencies installed"
else
    print_warning "⚠️  Client dependencies not installed (run: cd client && npm install)"
fi

# Test 6: Check if ports are available locally
print_status "Checking local port availability..."

if ! lsof -i :3000 > /dev/null 2>&1; then
    print_status "✅ Port 3000 is available"
else
    print_warning "⚠️  Port 3000 is in use"
fi

if ! lsof -i :5000 > /dev/null 2>&1; then
    print_status "✅ Port 5000 is available"
else
    print_warning "⚠️  Port 5000 is in use"
fi

echo ""
print_status "Test Summary:"
echo "📋 Configuration files are ready for deployment"
echo "🌐 Upload files to VPS: /var/www/MarkabaWebsite"
echo "🚀 Run deployment script: bash deploy.sh"
echo "📖 Follow the complete guide: DOMAIN_SETUP_GUIDE.md"

echo ""
print_status "Next steps:"
echo "1. Upload all files to your VPS"
echo "2. Run the deployment script on your VPS"
echo "3. Configure your domain DNS if not done already"
echo "4. Test the live website"

echo ""
print_status "Testing completed! 🎯"