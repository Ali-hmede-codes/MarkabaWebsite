const axios = require('axios');
const https = require('https');

// Create axios instance
const api = axios.create({
  baseURL: 'https://api.markaba.news',
  timeout: 10000,
  withCredentials: true,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

async function testAdsEndpoint() {
  try {
    console.log('🔐 Testing Ads Endpoint Directly...');
    console.log('==================================\n');
    
    // Step 1: Login first
    console.log('1️⃣ Logging in...');
    const loginResponse = await api.post('/api/v2/auth/login', {
      username: 'admin',
      password: 'AdminPass123!',
      remember_me: true
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    // Step 2: Test ads endpoint with detailed error logging
    console.log('\n2️⃣ Testing ads endpoint...');
    
    try {
      const adsResponse = await api.get('/api/v2/admin/ads', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('✅ Ads request successful!');
      console.log('📊 Status:', adsResponse.status);
      console.log('📋 Response:', JSON.stringify(adsResponse.data, null, 2));
      
    } catch (adsError) {
      console.log('❌ Ads request failed');
      console.log('📊 Status:', adsError.response?.status);
      console.log('📋 Status Text:', adsError.response?.statusText);
      console.log('📋 Response Headers:', adsError.response?.headers);
      console.log('📋 Response Data:', JSON.stringify(adsError.response?.data, null, 2));
      console.log('📋 Error Message:', adsError.message);
      
      if (adsError.response?.status === 500) {
        console.log('\n🔍 This is a server error. Checking server logs...');
        
        // Try to get more details by testing other endpoints
        console.log('\n3️⃣ Testing other admin endpoints for comparison...');
        
        try {
          const positionsResponse = await api.get('/api/v2/admin/ads/positions/list', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Positions endpoint works - Status:', positionsResponse.status);
        } catch (posError) {
          console.log('❌ Positions endpoint also fails - Status:', posError.response?.status);
        }
        
        try {
          const usersResponse = await api.get('/api/v2/admin/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Users endpoint works - Status:', usersResponse.status);
        } catch (userError) {
          console.log('❌ Users endpoint fails - Status:', userError.response?.status);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', error.response.data);
    }
  }
  
  console.log('\n==================================');
  console.log('🏁 Test completed');
}

testAdsEndpoint();