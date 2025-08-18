const https = require('https');

// Test the distributed refresh system
async function testDistributedRefresh() {
  console.log('Testing distributed football refresh system...');
  
  try {
    // Test the refresh endpoint
    const response = await makeRequest('POST', 'http://localhost:5000/api/football/matches/refresh');
    console.log('✅ Refresh endpoint working');
    console.log('Response status:', response.statusCode);
    
    // Test stored matches endpoint
    const storedResponse = await makeRequest('GET', 'http://localhost:5000/api/football/matches/stored');
    console.log('✅ Stored matches endpoint working');
    console.log('Response status:', storedResponse.statusCode);
    
    // Parse the response to check data
    const data = JSON.parse(storedResponse.body);
    if (data.success && data.data && data.data.length > 0) {
      console.log(`✅ Found ${data.data.length} matches in storage`);
      console.log('Sample match:', {
        id: data.data[0].fixture.id,
        teams: `${data.data[0].teams.home.name} vs ${data.data[0].teams.away.name}`,
        date: data.data[0].fixture.date
      });
    } else {
      console.log('❌ No matches found in storage');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Helper function to make HTTP requests
function makeRequest(method, url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Run the test
testDistributedRefresh();