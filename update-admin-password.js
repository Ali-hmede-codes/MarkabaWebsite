const bcrypt = require('bcryptjs');
const { query } = require('./server/db');

async function updateAdminPassword() {
  try {
    const newPassword = 'AdminPass123!';
    const saltRounds = 12;
    
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('Updating admin password in database...');
    const result = await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE role = "admin"',
      [hashedPassword]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Successfully updated password for ${result.affectedRows} admin user(s)`);
      console.log('New password: AdminPass123!');
      console.log('You can now log in with this password.');
    } else {
      console.log('❌ No admin users found to update.');
    }
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminPassword();