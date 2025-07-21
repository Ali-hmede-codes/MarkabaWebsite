const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await connection.execute(
      'SELECT id, featured_image FROM posts WHERE featured_image LIKE "/images/%"'
    );

    for (const row of rows) {
      const newPath = row.featured_image.replace('/images/', '/uploads/');
      await connection.execute(
        'UPDATE posts SET featured_image = ? WHERE id = ?',
        [newPath, row.id]
      );
      console.log(`Updated post ${row.id}: ${row.featured_image} -> ${newPath}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();