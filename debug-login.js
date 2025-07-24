require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4'
};

async function debugLogin() {
  let connection;
  
  try {
    console.log('Connecting to database with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '***' : 'empty'
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
    
    // Get admin user details
    const [users] = await connection.execute(
      'SELECT id, username, email, role, is_active, password, created_at, updated_at FROM users WHERE username = ?',
      ['admin']
    );
    
    if (users.length === 0) {
      console.log('❌ No admin user found');
      return;
    }
    
    const adminUser = users[0];
    console.log('\n📋 Admin user details:');
    console.log('- ID:', adminUser.id);
    console.log('- Username:', adminUser.username);
    console.log('- Email:', adminUser.email);
    console.log('- Role:', adminUser.role);
    console.log('- Active:', adminUser.is_active ? 'Yes' : 'No');
    console.log('- Password hash length:', adminUser.password ? adminUser.password.length : 'null');
    console.log('- Created:', adminUser.created_at);
    console.log('- Updated:', adminUser.updated_at);
    
    // Test password verification
    const testPassword = 'AdminPass123!';
    console.log('\n🔐 Testing password verification...');
    console.log('Testing password:', testPassword);
    
    if (adminUser.password) {
      const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
      console.log('Password match:', isValidPassword ? '✅ YES' : '❌ NO');
      
      if (!isValidPassword) {
        console.log('\n🔧 Updating admin password to:', testPassword);
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        await connection.execute(
          'UPDATE users SET password = ?, updated_at = NOW() WHERE username = ?',
          [hashedPassword, 'admin']
        );
        console.log('✅ Password updated successfully');
      }
    } else {
      console.log('❌ No password hash found for admin user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

debugLogin();