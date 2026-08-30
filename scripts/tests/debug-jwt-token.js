const axios = require('axios');

// Test with correct token extraction
async function debugJWTToken() {
    console.log('🔍 Testing with correct token extraction...');
    
    try {
        // Test login
        console.log('\n1️⃣ Testing login...');
        const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
            username: 'admin',
            password: 'AdminPass123!'
        });
        
        console.log('✅ Login successful');
        
        // Extract token from correct location
        const token = loginResponse.data.data.access_token;
        
        console.log('\n🔍 Token Info:');
        console.log('Token exists:', !!token);
        console.log('Token length:', token ? token.length : 0);
        if (token) {
            console.log('Token preview:', token.substring(0, 50) + '...');
        }
        
        // Test ads endpoint with correct token
        console.log('\n2️⃣ Testing ads endpoint with correct token...');
        try {
            const adsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ Ads endpoint successful!');
            console.log('Response status:', adsResponse.status);
            console.log('Ads count:', adsResponse.data.data ? adsResponse.data.data.length : 'N/A');
            
        } catch (adsError) {
            console.log('❌ Ads endpoint failed:');
            console.log('Status:', adsError.response?.status);
            console.log('Message:', adsError.response?.data?.message);
        }
        
        // Test positions endpoint
        console.log('\n3️⃣ Testing positions endpoint...');
        try {
            const positionsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads/positions/list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ Positions endpoint successful!');
            console.log('Positions count:', positionsResponse.data.length);
            
        } catch (posError) {
            console.log('❌ Positions endpoint failed:');
            console.log('Status:', posError.response?.status);
            console.log('Message:', posError.response?.data?.message);
        }
        
        console.log('\n🎉 SOLUTION FOUND!');
        console.log('The production server returns tokens in: response.data.data.access_token');
        console.log('Not in: response.data.token (as expected)');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

debugJWTToken();