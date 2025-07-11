# Database Setup Guide for NewsMarkaba

This guide will help you configure and set up the MySQL database for testing the NewsMarkaba application.

## Prerequisites

1. **MySQL Server** (8.0 or higher recommended)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP for Windows: https://www.apachefriends.org/

2. **phpMyAdmin** (optional but recommended)
   - Usually included with XAMPP/WAMP
   - Or access via web interface if using hosted MySQL

## Quick Setup Steps

### Option 1: Using XAMPP (Recommended for Testing)

1. **Install XAMPP**
   - Download and install XAMPP from https://www.apachefriends.org/
   - Start Apache and MySQL services from XAMPP Control Panel

2. **Access phpMyAdmin**
   - Open browser and go to: http://localhost/phpmyadmin
   - Login with username: `root` (no password by default)

3. **Create Database**
   - Click "New" to create a new database
   - Name it `markabadatabase`
   - Set collation to `utf8mb4_unicode_ci`
   - Click "Create"

4. **Import Database Schema**
   - Select the `markabadatabase` database
   - Click "Import" tab
   - Choose file: `sql/create_tables.sql`
   - Click "Go" to execute

### Option 2: Using MySQL Command Line

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE markabadatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Use the database
USE markabadatabase;

# Import the schema
source /path/to/NewsMarkaba/sql/create_tables.sql;
```

## Environment Configuration

1. **Update .env file** (already configured):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword  # Change this to your MySQL password
   DB_NAME=markabadatabase
   PORT=5000
   JWT_SECRET=your_super_secret_key_change_this_in_production
   UPLOAD_PATH=uploads/
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:5000
   ```

2. **Important**: Update `DB_PASSWORD` in `.env` file to match your MySQL root password

## Testing the Setup

### 1. Test Database Connection

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Test the connection
node -e "require('./db').testConnection()"
```

### 2. Start the Backend Server

```bash
# In the server directory
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📊 API Health: http://localhost:5000/api/health
🌍 Environment: development
```

### 3. Test API Endpoints

Open your browser or use curl to test:

- **Health Check**: http://localhost:5000/api/health
- **Categories**: http://localhost:5000/api/categories
- **Posts**: http://localhost:5000/api/posts
- **Settings**: http://localhost:5000/api/settings

### 4. Start the Frontend

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the app at: http://localhost:3000

## Default Login Credentials

- **Username**: admin
- **Email**: admin@newssite.com
- **Password**: admin123

## Database Structure

The database includes these main tables:

- **users**: Admin/editor accounts
- **categories**: News categories (Politics, Sports, etc.)
- **posts**: News articles with multilingual support
- **breaking_news**: Breaking news alerts
- **site_settings**: Dynamic site configuration

## Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Ensure MySQL service is running
   - Check if port 3306 is available
   - Verify credentials in .env file

2. **Access Denied**
   - Check MySQL username/password
   - Ensure user has proper privileges
   - Try resetting MySQL root password

3. **Database Not Found**
   - Ensure `markabadatabase` database exists
   - Re-run the SQL schema file

4. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on port 5000

### Reset Database

If you need to reset the database:

```sql
DROP DATABASE IF EXISTS markabadatabase;
CREATE DATABASE markabadatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE markabadatabase;
source /path/to/sql/create_tables.sql;
```

## Production Considerations

- Change JWT_SECRET to a strong, unique value
- Use environment-specific database credentials
- Enable SSL for database connections
- Set up proper backup procedures
- Configure proper user permissions (avoid using root)

## Need Help?

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all dependencies are installed
3. Ensure MySQL service is running
4. Check firewall settings if using remote database

The application should now be ready for testing with a fully configured database!