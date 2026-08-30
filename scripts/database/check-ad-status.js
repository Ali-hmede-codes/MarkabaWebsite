const db = require('../../server/config/database');

async function checkAllAds() {
  try {
    console.log('Checking all ads in database...');
    
    const [ads] = await db.execute(
      'SELECT id, title, is_active, start_date, expire_date, clicks FROM ads ORDER BY id'
    );
    
    if (ads.length === 0) {
      console.log('❌ No ads found in database');
      return;
    }
    
    console.log(`📊 Found ${ads.length} ads:`);
    console.log('\n' + '='.repeat(80));
    
    ads.forEach(ad => {
      const now = new Date();
      const expireDate = new Date(ad.expire_date);
      const startDate = new Date(ad.start_date);
      
      let status = '✅ Active';
      if (!ad.is_active) {
        status = '❌ Inactive';
      } else if (expireDate <= now) {
        status = '⏰ Expired';
      } else if (startDate > now) {
        status = '⏳ Not Started';
      }
      
      console.log(`ID: ${ad.id} | ${status}`);
      console.log(`Title: ${ad.title || 'No title'}`);
      console.log(`Start: ${ad.start_date}`);
      console.log(`Expire: ${ad.expire_date}`);
      console.log(`Clicks: ${ad.clicks}`);
      console.log('-'.repeat(40));
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAllAds();