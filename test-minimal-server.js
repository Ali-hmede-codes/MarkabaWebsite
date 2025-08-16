const axios = require('axios');

async function testMinimalServer() {
  try {
    console.log('🔍 Testing minimal server...');
    
    // Test database connection
    console.log('\n1️⃣ Testing database connection...');
    const dbResponse = await axios.get('http://localhost:3002/test-db');
    console.log('✅ Database test:', dbResponse.data);
    
    // Test tables
    console.log('\n2️⃣ Testing tables...');
    const tablesResponse = await axios.get('http://localhost:3002/test-tables');
    console.log('✅ Tables test:', tablesResponse.data);
    
    // Test ads route without auth (should fail)
    console.log('\n3️⃣ Testing ads route without auth...');
    try {
      const adsResponse = await axios.get('http://localhost:3002/test-ads');
      console.log('❌ Unexpected success:', adsResponse.data);
    } catch (error) {
      console.log('✅ Expected auth error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test ads route with fake token (should fail with different error)
    console.log('\n4️⃣ Testing ads route with fake token...');
    try {
      const adsResponse = await axios.get('http://localhost:3002/test-ads', {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('❌ Unexpected success:', adsResponse.data);
    } catch (error) {
      console.log('✅ Expected token error:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Wait for server to start
setTimeout(testMinimalServer, 3000);