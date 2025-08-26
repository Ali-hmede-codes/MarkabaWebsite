const { testConnection, sendPostNotification, sendBreakingNewsNotification, sendLastNewsNotification } = require('../services/oneSignalService');

// Test OneSignal connection and notifications
async function testOneSignalIntegration() {
  console.log('🔔 Testing OneSignal Integration...');
  console.log('=' .repeat(50));

  try {
    // Test 1: Connection test
    console.log('\n1. Testing OneSignal connection...');
    await testConnection();
    console.log('✅ OneSignal connection test passed');

    // Test 2: Post notification
    console.log('\n2. Testing post notification...');
    const testPost = {
      id: 999,
      title_ar: 'اختبار إشعار المقال',
      content_ar: 'هذا اختبار لإشعار المقال الجديد',
      slug: 'test-post-notification',
      category_name: 'تقنية',
      author_name: 'مطور الاختبار',
      featured_image: '/uploads/test-image.jpg'
    };
    
    await sendPostNotification(testPost);
    console.log('✅ Post notification sent successfully');

    // Test 3: Breaking news notification
    console.log('\n3. Testing breaking news notification...');
    const testBreakingNews = {
      id: 999,
      title_ar: 'اختبار الأخبار العاجلة',
      content_ar: 'هذا اختبار للأخبار العاجلة',
      slug: 'test-breaking-news',
      priority: 1,
      is_active: true
    };
    
    await sendBreakingNewsNotification(testBreakingNews);
    console.log('✅ Breaking news notification sent successfully');

    // Test 4: Last news notification
    console.log('\n4. Testing last news notification...');
    const testLastNews = {
      id: 999,
      title_ar: 'اختبار آخر الأخبار',
      content_ar: 'هذا اختبار لآخر الأخبار',
      slug: 'test-last-news',
      priority: 0,
      is_active: true
    };
    
    await sendLastNewsNotification(testLastNews);
    console.log('✅ Last news notification sent successfully');

    console.log(`\n${  '=' .repeat(50)}`);
    console.log('🎉 All OneSignal tests passed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure to set your actual OneSignal credentials in .env file');
    console.log('2. Test with real content creation through your admin panel');
    console.log('3. Verify notifications appear on subscribed devices');
    
  } catch (error) {
    console.error('❌ OneSignal test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has correct OneSignal credentials');
    console.log('2. Verify your OneSignal app is properly configured');
    console.log('3. Ensure you have active subscribers to receive notifications');
  }
}

// Run the test
if (require.main === module) {
  testOneSignalIntegration();
}

module.exports = { testOneSignalIntegration };