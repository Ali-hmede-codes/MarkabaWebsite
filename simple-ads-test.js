const axios = require('axios');

async function testAdsEndpoint() {
  try {
    console.log('🔍 Testing ads endpoint with simple request...');
    
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
      username: 'admin',
      password: 'AdminPass123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful, token length:', token.length);
    
    // Step 2: Test ads endpoint
    console.log('2️⃣ Testing ads endpoint...');
    const adsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Ads endpoint successful!');
    console.log('Response status:', adsResponse.status);
    console.log('Response data:', JSON.stringify(adsResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Error type:', error.constructor.name);
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testAdsEndpoint();