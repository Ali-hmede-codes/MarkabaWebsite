const db = require('./server/config/database');

async function checkAdsSchema() {
  try {
    console.log('Checking ads table schema...');
    
    // Check if ads table exists and get its structure
    const [tables] = await db.execute("SHOW TABLES LIKE 'ads'");
    console.log('Tables found:', tables);
    
    if (tables.length > 0) {
      // Get column information
      const [columns] = await db.execute("DESCRIBE ads");
      console.log('\nAds table columns:');
      columns.forEach(col => {
        console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check specifically for expire_date column
      const expireDateCol = columns.find(col => col.Field === 'expire_date');
      if (expireDateCol) {
        console.log('\n✅ expire_date column exists');
      } else {
        console.log('\n❌ expire_date column NOT found');
        // Check for similar columns
        const dateColumns = columns.filter(col => col.Field.includes('date') || col.Field.includes('expir'));
        console.log('Date-related columns found:', dateColumns.map(col => col.Field));
      }
    } else {
      console.log('❌ ads table not found');
    }
    
  } catch (error) {
    console.error('Error checking schema:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAdsSchema();