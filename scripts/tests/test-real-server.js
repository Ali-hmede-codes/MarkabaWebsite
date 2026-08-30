const axios = require('axios');

async function testRealServer() {
  try {
    console.log('🔍 Testing real server ads endpoint...');
    
    // First login to get a real token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
      username: 'admin',
      password: 'AdminPass123!'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    // Test ads endpoint with real token
    console.log('\n2️⃣ Testing ads endpoint with real token...');
    try {
      const adsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Ads endpoint success:', adsResponse.data);
    } catch (error) {
      console.log('❌ Ads endpoint error:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      console.log('Headers:', error.response?.headers);
      
      // Try to get more details
      if (error.response?.status === 500) {
        console.log('\n🔍 500 Error Details:');
        console.log('Response text:', error.response?.data);
      }
    }
    
    // Test positions endpoint for comparison
    console.log('\n3️⃣ Testing positions endpoint for comparison...');
    try {
      const positionsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads/positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Positions endpoint works - Status:', positionsResponse.status);
    } catch (error) {
      console.log('❌ Positions endpoint error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRealServer();