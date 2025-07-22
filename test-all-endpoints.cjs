const http = require('http');

// List of endpoints to test
const endpoints = [
  '/api/v2/posts',
  '/api/v2/categories',
  '/api/v2/breaking-news?active=true',
  '/api/v2/settings/public',
  '/api/v2/posts/featured',
  '/api/v2/posts/trending'
];

function testEndpoint(endpoint, host = 'localhost', port = 5000) {
  return new Promise((resolve) => {
    const url = `http://${host}:${port}${endpoint}`;
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = {
          endpoint,
          status: res.statusCode,
          success: res.statusCode === 200,
          error: null,
          dataLength: data.length
        };
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            result.hasData = parsed.success && parsed.data;
            result.dataType = Array.isArray(parsed.data) ? 'array' : typeof parsed.data;
          } catch (e) {
            result.error = 'Invalid JSON response';
            result.success = false;
          }
        } else {
          try {
            const parsed = JSON.parse(data);
            result.error = parsed.message || parsed.error || 'Unknown error';
          } catch (e) {
            result.error = data.substring(0, 100);
          }
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (err) => {
      resolve({
        endpoint,
        status: 0,
        success: false,
        error: err.message,
        dataLength: 0
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 0,
        success: false,
        error: 'Request timeout',
        dataLength: 0
      });
    });
  });
}

async function testAllEndpoints(host = 'localhost', port = 5000) {
  console.log(`\n🧪 Testing API endpoints on ${host}:${port}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    const result = await testEndpoint(endpoint, host, port);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${endpoint} - Status: ${result.status} - Data: ${result.dataLength} bytes`);
    } else {
      console.log(`❌ ${endpoint} - Status: ${result.status} - Error: ${result.error}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${endpoints.length}`);
  console.log(`❌ Failed: ${failed}/${endpoints.length}`);
  
  if (failed > 0) {
    console.log('\n🔍 Failed Endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.endpoint} - ${r.error}`);
    });
  }
  
  return results;
}

// Test localhost first
async function runTests() {
  console.log('🚀 API Endpoint Testing Tool');
  
  // Test localhost
  await testAllEndpoints('localhost', 5000);
  
  // Uncomment the line below to test your VPS
  // await testAllEndpoints('69.62.115.12', 5000);
  
  console.log('\n✨ Testing completed!');
}

runTests().catch(console.error);