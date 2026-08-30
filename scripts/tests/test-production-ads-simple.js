const axios = require('axios');

// Test production server ads endpoint with correct domain
async function testProductionAds() {
  console.log('🔍 Testing Production Ads Endpoint (markaba.news)...');
  
  try {
    // First test if the server is responding at all
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get('https://api.markaba.news/api/health', {
      timeout: 10000
    });
    console.log('✅ Server health check passed:', healthResponse.status);
    
  } catch (error) {
    console.log('❌ Server health check failed:', error.code || error.message);
  }
  
  try {
    // Test login endpoint
    console.log('\n2️⃣ Testing login endpoint...');
    const loginResponse = await axios.post('https://api.markaba.news/api/auth/login', {
      email: 'admin@newsmarkaba.com',
      password: 'admin123'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful, status:', loginResponse.status);
    const token = loginResponse.data.token;
    
    // Test ads endpoint with authentication
    console.log('\n3️⃣ Testing ads endpoint with auth...');
    const adsResponse = await axios.get('https://api.markaba.news/api/admin/ads', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Ads endpoint successful!');
    console.log('Response status:', adsResponse.status);
    console.log('Response data:', JSON.stringify(adsResponse.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Detailed Error Information:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('Request made but no response received');
      console.error('Request details:', error.request);
    }
  }
  
  // Test alternative endpoints
  try {
    console.log('\n4️⃣ Testing ads positions endpoint...');
    const positionsResponse = await axios.get('https://api.markaba.news/api/ads/positions', {
      timeout: 10000
    });
    
    console.log('✅ Positions endpoint successful!');
    console.log('Response:', positionsResponse.data);
    
  } catch (error) {
    console.error('❌ Positions endpoint error:', error.response?.status, error.response?.data || error.message);
  }
}

testProductionAds().catch(console.error);