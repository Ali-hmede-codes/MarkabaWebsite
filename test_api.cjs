const http = require('http');
const fs = require('fs');

// Test posts API
const testAPI = async () => {
  try {
    console.log('Testing Posts API...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v2/posts?limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Headers:', res.headers);
        console.log('Response Body:');
        console.log(data);
        
        // Save to file
        fs.writeFileSync('api_test_result.json', data);
        console.log('\nResult saved to api_test_result.json');
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
    });

    req.end();
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testAPI();