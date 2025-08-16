const db = require('./server/config/database');

async function fixLocalDatabaseColumn() {
  try {
    console.log('🔄 Renaming expiration_date to expire_date in local database...');
    
    // First, check current column name
    const [columns] = await db.execute("DESCRIBE ads");
    const hasExpirationDate = columns.some(col => col.Field === 'expiration_date');
    const hasExpireDate = columns.some(col => col.Field === 'expire_date');
    
    console.log('Current column status:');
    console.log('- expiration_date exists:', hasExpirationDate);
    console.log('- expire_date exists:', hasExpireDate);
    
    if (hasExpirationDate && !hasExpireDate) {
      // Rename the column
      const renameSQL = `
        ALTER TABLE ads 
        CHANGE COLUMN expiration_date expire_date DATETIME NOT NULL
      `;
      
      await db.execute(renameSQL);
      console.log('✅ Successfully renamed expiration_date to expire_date');
      
      // Verify the change
      const [newColumns] = await db.execute("DESCRIBE ads");
      const nowHasExpireDate = newColumns.some(col => col.Field === 'expire_date');
      const stillHasExpirationDate = newColumns.some(col => col.Field === 'expiration_date');
      
      console.log('\nVerification:');
      console.log('- expire_date exists:', nowHasExpireDate);
      console.log('- expiration_date exists:', stillHasExpirationDate);
      
      if (nowHasExpireDate && !stillHasExpirationDate) {
        console.log('🎉 Column rename completed successfully!');
      } else {
        console.log('⚠️ Something went wrong with the rename');
      }
    } else if (hasExpireDate && !hasExpirationDate) {
      console.log('✅ Column is already named expire_date - no changes needed');
    } else if (hasExpirationDate && hasExpireDate) {
      console.log('⚠️ Both columns exist - manual intervention required');
    } else {
      console.log('❌ Neither column found - check table structure');
    }
    
  } catch (error) {
    console.error('❌ Error fixing database column:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

fixLocalDatabaseColumn();