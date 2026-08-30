const axios = require('axios');
const https = require('https');

// Create axios instance with cookie jar and SSL config
const api = axios.create({
  baseURL: 'https://api.markaba.news',
  timeout: 10000,
  withCredentials: true,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // For self-signed certificates
  }),
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

async function testAdsAuthentication() {
  try {
    console.log('🔐 Testing Ads Authentication...');
    console.log('================================\n');
    
    // Step 1: Login to get tokens
    console.log('1️⃣ Attempting login...');
    const loginResponse = await api.post('/api/v2/auth/login', {
      username: 'admin',
      password: 'AdminPass123!',
      remember_me: true
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('📋 User:', loginResponse.data.data.user.username);
      console.log('🔑 Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
      
      // Extract cookies from response
      const cookies = loginResponse.headers['set-cookie'];
      console.log('🍪 Cookies received:', cookies ? cookies.length : 0);
      
      if (cookies) {
        cookies.forEach((cookie, index) => {
          console.log(`   Cookie ${index + 1}: ${cookie.split(';')[0]}`);
        });
      }
      
      // Store token for manual requests
      const token = loginResponse.data.data.token;
      
      console.log('\n2️⃣ Testing ads endpoint with cookies...');
      
      // Test with cookies (should work automatically)
      try {
        const adsResponse = await api.get('/api/v2/admin/ads');
        console.log('✅ Ads request with cookies successful');
        console.log('📊 Response status:', adsResponse.status);
        console.log('📋 Ads count:', adsResponse.data.data?.ads?.length || 0);
      } catch (cookieError) {
        console.log('❌ Ads request with cookies failed:', cookieError.response?.status, cookieError.response?.data?.message);
        
        console.log('\n3️⃣ Testing ads endpoint with manual token...');
        
        // Test with manual Authorization header
        try {
          const manualResponse = await api.get('/api/v2/admin/ads', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Ads request with manual token successful');
          console.log('📊 Response status:', manualResponse.status);
          console.log('📋 Ads count:', manualResponse.data.data?.ads?.length || 0);
        } catch (manualError) {
          console.log('❌ Ads request with manual token failed:', manualError.response?.status, manualError.response?.data?.message);
        }
      }
      
      console.log('\n4️⃣ Testing ad positions endpoint...');
      
      // Test ad positions endpoint
      try {
        const positionsResponse = await api.get('/api/v2/admin/ads/positions/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Ad positions request successful');
        console.log('📊 Response status:', positionsResponse.status);
        console.log('📋 Positions count:', positionsResponse.data.data?.length || 0);
        
        if (positionsResponse.data.data && positionsResponse.data.data.length > 0) {
          console.log('📍 Available positions:');
          positionsResponse.data.data.forEach(pos => {
            console.log(`   - ${pos.name} (${pos.name_ar}) - ${pos.width}x${pos.height}`);
          });
        }
      } catch (posError) {
        console.log('❌ Ad positions request failed:', posError.response?.status, posError.response?.data?.message);
      }
      
      console.log('\n5️⃣ Testing refresh token functionality...');
      
      // Test refresh token
      try {
        const refreshResponse = await api.post('/api/v2/auth/refresh');
        console.log('✅ Refresh token successful');
        console.log('🔑 New token received:', refreshResponse.data.data?.token ? 'Yes' : 'No');
      } catch (refreshError) {
        console.log('❌ Refresh token failed:', refreshError.response?.status, refreshError.response?.data?.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', error.response.data);
    }
  }
  
  console.log('\n================================');
  console.log('🏁 Authentication test completed');
}

// Additional function to test direct API call without login
async function testDirectApiCall() {
  console.log('\n🔍 Testing direct API call without authentication...');
  
  try {
    const response = await api.get('/api/v2/admin/ads');
    console.log('✅ Direct call successful (unexpected)');
    console.log('📊 Status:', response.status);
  } catch (error) {
    console.log('❌ Direct call failed (expected):', error.response?.status, error.response?.data?.message);
  }
}

// Run tests
async function runAllTests() {
  await testDirectApiCall();
  await testAdsAuthentication();
}

runAllTests();