const axios = require('axios');

async function testCorrectEndpoints() {
  try {
    console.log('🔍 Testing correct admin endpoint paths...');
    
    // Login first
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
      username: 'admin',
      password: 'AdminPass123!'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    // Test correct admin users endpoint
    console.log('\n2️⃣ Testing correct users endpoint...');
    try {
      const usersResponse = await axios.get('https://api.markaba.news/api/v2/admin/administratorpage/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Users endpoint works:', usersResponse.status);
    } catch (error) {
      console.log('❌ Users endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test correct admin categories endpoint
    console.log('\n3️⃣ Testing correct categories endpoint...');
    try {
      const categoriesResponse = await axios.get('https://api.markaba.news/api/v2/admin/administratorpage/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Categories endpoint works:', categoriesResponse.status);
    } catch (error) {
      console.log('❌ Categories endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test ads endpoint (should work as it's directly mounted)
    console.log('\n4️⃣ Testing ads endpoint...');
    try {
      const adsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Ads endpoint works:', adsResponse.status, adsResponse.data);
    } catch (error) {
      console.log('❌ Ads endpoint error:', error.response?.status, error.response?.data);
      
      // If still 500, let's try to get more details
      if (error.response?.status === 500) {
        console.log('\n🔍 500 Error Details:');
        console.log('Response headers:', error.response?.headers);
        console.log('Response text:', error.response?.data);
      }
    }
    
    // Test ads positions endpoint
    console.log('\n5️⃣ Testing ads positions endpoint...');
    try {
      const positionsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads/positions/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Positions endpoint works:', positionsResponse.status, positionsResponse.data);
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

testCorrectEndpoints();