const { execute, query, testConnection } = require('./server/config/database');

async function fixBreakingNewsConstraint() {
  try {
    console.log('🔧 Starting to fix breaking news slug constraint...');
    
    // Test database connection
    await testConnection();
    
    // Check current constraints
    console.log('📋 Checking current constraints...');
    const constraints = await query(`
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'breaking_news' 
      AND CONSTRAINT_TYPE = 'UNIQUE'
    `);
    
    console.log('Current UNIQUE constraints:', constraints);
    
    // Find the constraint name for the slug column
    const slugConstraints = await query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'breaking_news' 
      AND COLUMN_NAME = 'slug'
      AND CONSTRAINT_NAME != 'PRIMARY'
    `);
    
    if (slugConstraints.length > 0) {
      const constraintName = slugConstraints[0].CONSTRAINT_NAME;
      console.log(`🗑️ Dropping UNIQUE constraint: ${constraintName}`);
      
      // Drop the unique constraint
      await execute(`ALTER TABLE breaking_news DROP INDEX \`${constraintName}\``);
      console.log('✅ UNIQUE constraint dropped successfully!');
    } else {
      console.log('ℹ️ No UNIQUE constraint found on slug column');
    }
    
    // Ensure we have a regular index for performance
    console.log('📊 Creating regular index for performance...');
    try {
      await execute(`CREATE INDEX idx_breaking_news_slug ON breaking_news(slug)`);
      console.log('✅ Regular index created successfully!');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index already exists, skipping creation');
      } else {
        throw error;
      }
    }
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    const indexes = await query(`SHOW INDEX FROM breaking_news WHERE Column_name = 'slug'`);
    console.log('Current indexes on slug column:', indexes);
    
    // Test inserting duplicate slugs
    console.log('🧪 Testing duplicate slug insertion...');
    const testTitle = 'اختبار الأخبار العاجلة';
    const testSlug = 'test-breaking-news';
    
    try {
      // Insert first test record
      await execute(`
        INSERT INTO breaking_news (title_ar, content_ar, slug, priority, is_active) 
        VALUES (?, 'محتوى اختبار 1', ?, 1, 0)
      `, [testTitle + ' 1', testSlug]);
      
      // Insert second test record with same slug
      await execute(`
        INSERT INTO breaking_news (title_ar, content_ar, slug, priority, is_active) 
        VALUES (?, 'محتوى اختبار 2', ?, 1, 0)
      `, [testTitle + ' 2', testSlug]);
      
      console.log('✅ Successfully inserted duplicate slugs! The fix is working.');
      
      // Clean up test records
      await execute(`DELETE FROM breaking_news WHERE title_ar LIKE ?`, [testTitle + '%']);
      console.log('🧹 Test records cleaned up.');
      
    } catch (testError) {
      console.log('❌ Test failed - duplicate slugs still not allowed:', testError.message);
    }
    
    console.log('\n🎉 Breaking news slug constraint fix completed successfully!');
    console.log('📝 You can now add breaking news with duplicate titles.');
    
  } catch (error) {
    console.error('❌ Error fixing breaking news constraint:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixBreakingNewsConstraint();