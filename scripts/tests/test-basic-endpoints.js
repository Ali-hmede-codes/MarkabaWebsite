const axios = require('axios');

async function testBasicEndpoints() {
  try {
    console.log('🔍 Testing basic server endpoints...');
    
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    try {
      const healthResponse = await axios.get('https://api.markaba.news/health');
      console.log('✅ Health endpoint works:', healthResponse.status, healthResponse.data);
    } catch (error) {
      console.log('❌ Health endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test API root
    console.log('\n2️⃣ Testing API root...');
    try {
      const apiResponse = await axios.get('https://api.markaba.news/api');
      console.log('✅ API root works:', apiResponse.status, apiResponse.data);
    } catch (error) {
      console.log('❌ API root error:', error.response?.status, error.response?.data);
    }
    
    // Test v2 API root
    console.log('\n3️⃣ Testing v2 API root...');
    try {
      const v2Response = await axios.get('https://api.markaba.news/api/v2');
      console.log('✅ V2 API works:', v2Response.status, v2Response.data);
    } catch (error) {
      console.log('❌ V2 API error:', error.response?.status, error.response?.data);
    }
    
    // Test login endpoint
    console.log('\n4️⃣ Testing login endpoint...');
    try {
      const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
        username: 'admin',
        password: 'AdminPass123!'
      });
      console.log('✅ Login works:', loginResponse.status);
      
      const token = loginResponse.data.data.token;
      
      // Test a working admin endpoint
      console.log('\n5️⃣ Testing users endpoint...');
      try {
        const usersResponse = await axios.get('https://api.markaba.news/api/v2/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Users endpoint works:', usersResponse.status);
      } catch (error) {
        console.log('❌ Users endpoint error:', error.response?.status, error.response?.data);
      }
      
      // Test categories endpoint
      console.log('\n6️⃣ Testing categories endpoint...');
      try {
        const categoriesResponse = await axios.get('https://api.markaba.news/api/v2/admin/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Categories endpoint works:', categoriesResponse.status);
      } catch (error) {
        console.log('❌ Categories endpoint error:', error.response?.status, error.response?.data);
      }
      
    } catch (error) {
      console.log('❌ Login error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicEndpoints();