const bcrypt = require('bcryptjs');
const { query, queryOne } = require('./server/db');

async function createAdminUser() {
  try {
    console.log('👤 Creating admin user (simple version)...');
    
    const adminData = {
      username: 'admin',
      email: 'admin@newsmarkaba.com',
      password: 'AdminPass123!',
      display_name: 'Administrator',
      role: 'admin',
      bio: 'System Administrator',
      is_active: 1
    };
    
    // Check if admin user already exists
    const existingAdmin = await queryOne(
      'SELECT id, username, email FROM users WHERE role = "admin" OR username = ? OR email = ?',
      [adminData.username, adminData.email]
    );
    
    if (existingAdmin) {
      console.log('📝 Admin user already exists, updating password...');
      
      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
      
      // Update existing admin user (without auth columns)
      await query(
        `UPDATE users SET 
          password = ?,
          display_name = ?,
          bio = ?,
          is_active = 1,
          updated_at = NOW()
        WHERE id = ?`,
        [hashedPassword, adminData.display_name, adminData.bio, existingAdmin.id]
      );
      
      console.log(`✅ Updated existing admin user: ${existingAdmin.username} (${existingAdmin.email})`);
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
      
      // Create new admin user (without auth columns)
      const result = await query(
        `INSERT INTO users (
          username, email, password, display_name, role, bio, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          adminData.username,
          adminData.email,
          hashedPassword,
          adminData.display_name,
          adminData.role,
          adminData.bio,
          adminData.is_active
        ]
      );
      
      console.log(`✅ Created new admin user with ID: ${result.insertId}`);
    }
    
    // Verify the admin user
    const adminUser = await queryOne(
      'SELECT id, username, email, display_name, role, is_active FROM users WHERE role = "admin"'
    );
    
    if (adminUser) {
      console.log('\n🎉 Admin user setup completed!');
      console.log('📋 Admin Details:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Display Name: ${adminUser.display_name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.is_active ? 'Yes' : 'No'}`);
      console.log('\n🔑 Login Credentials:');
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Password: ${adminData.password}`);
      console.log('\n🌐 You can now log in at: https://markaba.news/auth/login');
    } else {
      console.log('❌ Failed to verify admin user creation');
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

createAdminUser().then(() => {
  console.log('\n✨ Admin setup process completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});