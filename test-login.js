const fetch = require('node-fetch');

const testLogin = async () => {
  try {
    console.log('Testing login endpoint...');
    
    const response = await fetch('https://api.markaba.news/api/v2/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'AdminPass123!' // Default password - user should change this
      })
    });
    
    const data = await response.json();
    console.log('Login response status:', response.status);
    console.log('Login response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.token) {
      console.log('\nTesting ads positions endpoint with token...');
      
      const adsResponse = await fetch('https://api.markaba.news/api/v2/admin/ads/positions/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.data.token}`
        }
      });
      
      const adsData = await adsResponse.json();
      console.log('Ads positions response status:', adsResponse.status);
      console.log('Ads positions response:', JSON.stringify(adsData, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testLogin();