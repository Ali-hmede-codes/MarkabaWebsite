const http = require('http');

function testAPI() {
  const req = http.get('http://localhost:5000/api/v2/posts', (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      
      if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ API Test Successful!');
          console.log('Posts count:', parsed.data.posts.length);
          console.log('Total posts:', parsed.data.pagination.total);
        } catch (error) {
          console.log('❌ JSON Parse Error:', error.message);
          console.log('Raw response:', data.substring(0, 200));
        }
      } else {
        console.log('❌ API Error - Status:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Request Error:', err.message);
  });
  
  req.setTimeout(5000, () => {
    console.error('❌ Request Timeout');
    req.destroy();
  });
}

console.log('Testing API endpoint: http://localhost:5000/api/v2/posts');
testAPI();