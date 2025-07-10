const axios = require('axios');

async function testSocialMediaAPI() {
  try {
    console.log('Testing social media API endpoint...');
    const response = await axios.get('http://localhost:5000/api/v2/social-media');
    
    console.log('Status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check the structure
    if (response.data) {
      console.log('\nResponse structure analysis:');
      console.log('- Has success property:', 'success' in response.data);
      console.log('- Has data property:', 'data' in response.data);
      console.log('- Response keys:', Object.keys(response.data));
      
      if (response.data.data) {
        console.log('- Data is array:', Array.isArray(response.data.data));
        console.log('- Data length:', response.data.data.length);
        if (response.data.data.length > 0) {
          console.log('- First item keys:', Object.keys(response.data.data[0]));
        }
      }
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSocialMediaAPI();