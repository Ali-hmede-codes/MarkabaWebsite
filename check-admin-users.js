const db = require('./config/database');
const bcrypt = require('bcrypt');

async function checkAdminUsers() {
  try {
    console.log('Checking admin users in database...');
    
    const [users] = await db.execute(
      "SELECT id, username, email, display_name, role, is_active, password FROM users WHERE role = 'admin'"
    );
    
    console.log('\nAdmin users found:', users.length);
    
    for (const user of users) {
      console.log('\n--- User Details ---');
      console.log('ID:', user.id);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Display Name:', user.display_name);
      console.log('Role:', user.role);
      console.log('Is Active:', user.is_active);
      console.log('Password Hash:', user.password ? user.password.substring(0, 20) + '...' : 'No password');
      
      // Test password verification
      if (user.password) {
        const testPasswords = ['admin123', 'admin', '123456', 'password'];
        for (const testPass of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPass, user.password);
            if (isValid) {
              console.log(`✅ Password '${testPass}' is VALID for user ${user.username}`);
            }
          } catch (err) {
            // Silent fail for invalid hashes
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking admin users:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAdminUsers();