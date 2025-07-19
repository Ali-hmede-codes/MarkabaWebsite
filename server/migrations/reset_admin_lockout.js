const db = require('../db');


async function resetAdminLockout() {
  try {
    const connection = await db.pool.getConnection();
    await connection.query(
      'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE username = ?',
      ['admin']
    );
    connection.release();
    console.log('Admin lockout reset successfully.');
  } catch (error) {
    console.error('Error resetting admin lockout:', error);
    process.exit(1);
  }
}

resetAdminLockout();