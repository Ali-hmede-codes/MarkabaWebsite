const http = require('http');

// Test breaking news API (public endpoint)
const testBreakingNewsAPI = async () => {
  try {
    console.log('Testing Breaking News API (Active endpoint)...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v2/breaking-news/active?limit=5',
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
        console.log('Breaking News API Status Code:', res.statusCode);
        console.log('Breaking News API Response:');
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

testBreakingNewsAPI();