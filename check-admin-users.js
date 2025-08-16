const db = require('./server/config/database');

(async () => {
  try {
    console.log('Checking admin users...');
    const [users] = await db.execute('SELECT id, username, email, role FROM users WHERE role = "admin" LIMIT 5');
    console.log('Admin users found:', users.length);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
})();