const fetch = require('node-fetch');

// Test OneSignal notifications for breaking news and last news
async function testOneSignalNotifications() {
  const API_BASE_URL = 'http://localhost:5000/api/v2';
  
  // You'll need to get a valid admin token first
  const adminToken = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual token
  
  console.log('🧪 Testing OneSignal Notifications...');
  
  try {
    // Test 1: Create breaking news with notification
    console.log('\n📰 Testing Breaking News Notification...');
    const breakingNewsResponse = await fetch(`${API_BASE_URL}/admin/administratorpage/breaking-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title_ar: 'خبر عاجل - اختبار إشعارات OneSignal',
        content_ar: 'هذا اختبار لإشعارات OneSignal للأخبار العاجلة',
        priority: 1,
        is_active: true
      })
    });
    
    const breakingNewsData = await breakingNewsResponse.json();
    console.log('Breaking News Response:', breakingNewsData);
    
    if (breakingNewsData.success) {
      console.log('✅ Breaking news created successfully');
      console.log('📱 Check your OneSignal dashboard for notification delivery');
    } else {
      console.log('❌ Failed to create breaking news:', breakingNewsData.message);
    }
    
    // Wait a bit before next test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Create last news with notification
    console.log('\n📄 Testing Last News Notification...');
    const lastNewsResponse = await fetch(`${API_BASE_URL}/admin/administratorpage/last-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title_ar: 'آخر الأخبار - اختبار إشعارات OneSignal',
        content_ar: 'هذا اختبار لإشعارات OneSignal لآخر الأخبار',
        priority: 1,
        is_active: true
      })
    });
    
    const lastNewsData = await lastNewsResponse.json();
    console.log('Last News Response:', lastNewsData);
    
    if (lastNewsData.success) {
      console.log('✅ Last news created successfully');
      console.log('📱 Check your OneSignal dashboard for notification delivery');
    } else {
      console.log('❌ Failed to create last news:', lastNewsData.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions
console.log('📋 OneSignal Notification Test Instructions:');
console.log('1. Make sure your server is running on port 5000');
console.log('2. Update the adminToken variable with a valid admin JWT token');
console.log('3. Ensure OneSignal environment variables are set in server/.env:');
console.log('   - ONESIGNAL_APP_ID');
console.log('   - ONESIGNAL_APP_AUTH_KEY');
console.log('   - ONESIGNAL_USER_AUTH_KEY');
console.log('4. Run this test: node test-onesignal-notifications.js');
console.log('5. Check your OneSignal dashboard for notification delivery\n');

// Uncomment the line below to run the test
// testOneSignalNotifications();

module.exports = { testOneSignalNotifications };