const { query } = require('./server/db');

async function addSampleCategories() {
  try {
    console.log('Adding sample categories with Arabic and English names...');
    
    const categories = [
      {
        name: 'Politics',
        name_ar: 'السياسة',
        slug: 'politics',
        description: 'Political news and analysis',
        description_ar: 'الأخبار والتحليلات السياسية'
      },
      {
        name: 'Technology',
        name_ar: 'التكنولوجيا',
        slug: 'technology',
        description: 'Latest technology news and trends',
        description_ar: 'أحدث أخبار واتجاهات التكنولوجيا'
      },
      {
        name: 'Sports',
        name_ar: 'الرياضة',
        slug: 'sports',
        description: 'Sports news and updates',
        description_ar: 'أخبار وتحديثات رياضية'
      },
      {
        name: 'Business',
        name_ar: 'الأعمال',
        slug: 'business',
        description: 'Business and economic news',
        description_ar: 'أخبار الأعمال والاقتصاد'
      }
    ];

    for (const category of categories) {
      // Check if category already exists
      const existing = await query(
        'SELECT id FROM categories WHERE slug = ?',
        [category.slug]
      );

      if (existing.length === 0) {
        await query(
          `INSERT INTO categories (name, name_ar, slug, description, description_ar, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [category.name, category.name_ar, category.slug, category.description, category.description_ar]
        );
        console.log(`✓ Added category: ${category.name} (${category.name_ar})`);
      } else {
        // Update existing category with Arabic name if missing
        await query(
          `UPDATE categories SET name_ar = ?, description_ar = ?, updated_at = NOW() 
           WHERE slug = ? AND (name_ar IS NULL OR name_ar = '')`,
          [category.name_ar, category.description_ar, category.slug]
        );
        console.log(`✓ Updated category: ${category.name} (${category.name_ar})`);
      }
    }

    console.log('\nSample categories added successfully!');
    
    // Display all categories
    const allCategories = await query(`
      SELECT id, name, name_ar, slug, description, description_ar
      FROM categories 
      ORDER BY name ASC
    `);
    
    console.log('\nAll categories:');
    console.log('===============');
    allCategories.forEach(cat => {
      console.log(`${cat.name} (${cat.name_ar}) - /${cat.slug}`);
    });
    
  } catch (error) {
    console.error('Error adding sample categories:', error);
  } finally {
    process.exit(0);
  }
}

addSampleCategories();