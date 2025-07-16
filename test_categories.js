const http = require('http');

// Test categories API
const testCategoriesAPI = async () => {
  try {
    console.log('Testing Categories API...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v2/categories?limit=5',
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
        console.log('Categories API Status Code:', res.statusCode);
        console.log('Categories API Response:');
        console.log(JSON.stringify(JSON.parse(data), null, 2));
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

testCategoriesAPI();