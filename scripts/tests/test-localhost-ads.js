const axios = require('axios');

async function testLocalhostAds() {
  try {
    console.log('🔍 Testing localhost ads endpoint...');
    
    // Login first
    console.log('\n1️⃣ Logging in to localhost...');
    const loginResponse = await axios.post('http://localhost:5000/api/v2/auth/login', {
      username: 'admin',
      password: 'AdminPass123!'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    // Test ads endpoint on localhost
    console.log('\n2️⃣ Testing localhost ads endpoint...');
    try {
      const adsResponse = await axios.get('http://localhost:5000/api/v2/admin/ads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Localhost ads endpoint works:', adsResponse.status);
      console.log('📊 Ads data:', JSON.stringify(adsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Localhost ads endpoint error:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 500) {
        console.log('\n🔍 500 Error Details:');
        console.log('Response headers:', error.response?.headers);
        console.log('Response text:', error.response?.data);
      }
    }
    
    // Test positions endpoint on localhost
    console.log('\n3️⃣ Testing localhost positions endpoint...');
    try {
      const positionsResponse = await axios.get('http://localhost:5000/api/v2/admin/ads/positions/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Localhost positions endpoint works:', positionsResponse.status);
      console.log('📊 Positions data:', JSON.stringify(positionsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Localhost positions endpoint error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testLocalhostAds();