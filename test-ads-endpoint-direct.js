const axios = require('axios');

// Direct test of the ads endpoint with proper authentication
async function testAdsEndpointDirect() {
    console.log('🔍 Testing ads endpoint directly with proper authentication...');
    
    try {
        // Step 1: Login to get token
        console.log('\n1️⃣ Logging in...');
        const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
            username: 'admin',
            password: 'AdminPass123!'
        });
        
        const token = loginResponse.data.data.access_token;
        console.log('✅ Login successful, token obtained');
        
        // Step 2: Test ads endpoint with detailed error capture
        console.log('\n2️⃣ Testing ads endpoint...');
        try {
            const adsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            
            console.log('✅ Ads endpoint successful!');
            console.log('Status:', adsResponse.status);
            console.log('Response structure:', {
                success: adsResponse.data.success,
                hasData: !!adsResponse.data.data,
                adsCount: adsResponse.data.data?.ads?.length || 0,
                hasPagination: !!adsResponse.data.data?.pagination
            });
            
            if (adsResponse.data.data?.ads?.length > 0) {
                console.log('Sample ad:', adsResponse.data.data.ads[0]);
            } else {
                console.log('No ads found (empty array)');
            }
            
        } catch (adsError) {
            console.log('❌ Ads endpoint failed!');
            console.log('Error type:', adsError.constructor.name);
            
            if (adsError.response) {
                // Server responded with error status
                console.log('Response Status:', adsError.response.status);
                console.log('Response Headers:', Object.keys(adsError.response.headers));
                console.log('Response Data:', adsError.response.data);
                
                // Check if it's a timeout or server error
                if (adsError.response.status === 500) {
                    console.log('\n🔍 500 Error Details:');
                    console.log('Message:', adsError.response.data.message);
                    console.log('Success flag:', adsError.response.data.success);
                }
            } else if (adsError.request) {
                // Request was made but no response received
                console.log('No response received');
                console.log('Request timeout or network error');
            } else {
                // Something else happened
                console.log('Request setup error:', adsError.message);
            }
        }
        
        // Step 3: Test a simpler endpoint for comparison
        console.log('\n3️⃣ Testing positions endpoint for comparison...');
        try {
            const positionsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads/positions/list', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Positions endpoint successful!');
            console.log('Positions count:', positionsResponse.data.length);
            
        } catch (posError) {
            console.log('❌ Positions endpoint also failed:', posError.response?.status, posError.response?.data?.message);
        }
        
    } catch (error) {
        console.log('❌ Login or setup error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testAdsEndpointDirect();