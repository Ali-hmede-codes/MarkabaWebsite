const { query } = require('./server/db');

async function checkCategories() {
  try {
    console.log('Checking categories in database...');
    
    const categories = await query(`
      SELECT 
        c.id, c.name, c.name_ar, c.slug, c.created_at,
        COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      GROUP BY c.id, c.name, c.name_ar, c.slug, c.created_at
      ORDER BY c.name ASC
    `);
    
    console.log('\nCategories found:');
    console.log('================');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id}`);
      console.log(`English: ${cat.name}`);
      console.log(`Arabic: ${cat.name_ar}`);
      console.log(`Slug: ${cat.slug}`);
      console.log(`Posts: ${cat.post_count}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking categories:', error);
    process.exit(1);
  }
}

checkCategories();