const axios = require('axios');

async function testDebugServer() {
  try {
    console.log('🔍 Testing debug server...');
    
    // Test the ads endpoint directly
    console.log('\n1️⃣ Testing ads endpoint without auth...');
    try {
      const response = await axios.get('http://localhost:3001/test-ads');
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Expected auth error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test with a fake token
    console.log('\n2️⃣ Testing ads endpoint with fake token...');
    try {
      const response = await axios.get('http://localhost:3001/test-ads', {
        headers: {
          'Authorization': 'Bearer fake-token-for-testing'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error with fake token:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait a moment for the server to start
setTimeout(testDebugServer, 3000);