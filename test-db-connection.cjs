const { testConnection, query } = require('./server/db');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    await testConnection();
    console.log('✅ Basic connection test passed');
    
    // Test a simple query
    const result = await query('SELECT 1 as test');
    console.log('✅ Simple query test passed:', result);
    
    // Test settings table
    try {
      const settings = await query('SELECT COUNT(*) as count FROM site_settings LIMIT 1');
      console.log('✅ Settings table accessible:', settings);
    } catch (error) {
      console.log('❌ Settings table error:', error.message);
    }
    
    // Test posts table
    try {
      const posts = await query('SELECT COUNT(*) as count FROM posts LIMIT 1');
      console.log('✅ Posts table accessible:', posts);
    } catch (error) {
      console.log('❌ Posts table error:', error.message);
    }
    
    // Test categories table
    try {
      const categories = await query('SELECT COUNT(*) as count FROM categories LIMIT 1');
      console.log('✅ Categories table accessible:', categories);
    } catch (error) {
      console.log('❌ Categories table error:', error.message);
    }
    
    // Test breaking_news table
    try {
      const breakingNews = await query('SELECT COUNT(*) as count FROM breaking_news LIMIT 1');
      console.log('✅ Breaking news table accessible:', breakingNews);
    } catch (error) {
      console.log('❌ Breaking news table error:', error.message);
    }
    
    console.log('\n🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
  }
  
  process.exit(0);
}

testDatabaseConnection();