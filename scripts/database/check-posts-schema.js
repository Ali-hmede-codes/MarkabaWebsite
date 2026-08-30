const db = require('../../server/config/database');

async function checkSchema() {
  try {
    const [rows] = await db.execute('DESCRIBE posts');
    console.log('Posts table columns:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();