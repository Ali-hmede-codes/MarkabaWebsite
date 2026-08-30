const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Adjust if your server runs on a different port
const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token

// Test data for creating a new post
const testPostData = {
  title_ar: 'خبر تجريبي لاختبار الإشعارات',
  content_ar: 'هذا محتوى تجريبي لاختبار إرسال الإشعارات عبر OneSignal عند إنشاء منشور جديد. يحتوي هذا المنشور على معلومات مهمة للقراء.',
  excerpt_ar: 'خبر تجريبي لاختبار الإشعارات',
  category_id: 1, // Make sure this category exists in your database
  featured_image: '/images/test-image.jpg',
  tags: ['تجربة', 'إشعارات', 'OneSignal'],
  meta_description_ar: 'خبر تجريبي لاختبار الإشعارات',
  meta_keywords_ar: 'تجربة, إشعارات, OneSignal',
  is_featured: false,
  is_published: true // This will trigger the OneSignal notification
};

async function testPostNotification() {
  try {
    console.log('🚀 Testing OneSignal notification for posts...');
    console.log('📝 Creating new post with notification...');
    
    const response = await axios.post(
      `${BASE_URL}/api/posts`,
      testPostData,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Post created successfully!');
      console.log('📄 Post details:', {
        id: response.data.data.id,
        title: response.data.data.title_ar,
        slug: response.data.data.slug,
        is_published: response.data.data.is_published
      });
      console.log('🔔 OneSignal notification should have been sent!');
      console.log('📱 Check your OneSignal dashboard and test devices for the notification.');
    } else {
      console.error('❌ Failed to create post:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing post notification:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Instructions
console.log('📋 OneSignal Posts Notification Test');
console.log('=====================================');
console.log('Before running this test:');
console.log('1. Make sure your server is running on the correct port');
console.log('2. Update ADMIN_TOKEN with a valid admin JWT token');
console.log('3. Ensure OneSignal environment variables are set in server/.env:');
console.log('   - ONESIGNAL_APP_ID');
console.log('   - ONESIGNAL_APP_AUTH_KEY');
console.log('   - ONESIGNAL_USER_AUTH_KEY');
console.log('4. Make sure category_id in testPostData exists in your database');
console.log('5. Have OneSignal test devices or web push subscribers ready');
console.log('');
console.log('Running test in 3 seconds...');
console.log('');

// Run the test
setTimeout(testPostNotification, 3000);