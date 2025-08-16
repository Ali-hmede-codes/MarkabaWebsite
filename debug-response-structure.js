const axios = require('axios');

// Debug the exact response structures
async function debugResponseStructure() {
    console.log('🔍 Debugging response structures...');
    
    try {
        // Login
        const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
            username: 'admin',
            password: 'AdminPass123!'
        });
        
        const token = loginResponse.data.data.access_token;
        console.log('✅ Login successful');
        
        // Test positions endpoint structure
        console.log('\n1️⃣ Testing positions endpoint structure...');
        try {
            const positionsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads/positions/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('✅ Positions endpoint successful');
            console.log('Full response structure:');
            console.log(JSON.stringify(positionsResponse.data, null, 2));
            
        } catch (posError) {
            console.log('❌ Positions endpoint failed:', posError.response?.status, posError.response?.data);
        }
        
        // Test a simple database query to see if it's a connection issue
        console.log('\n2️⃣ Testing a simple endpoint that should work...');
        try {
            // Try the dashboard endpoint or another simple admin endpoint
            const dashboardResponse = await axios.get('https://api.markaba.news/api/v2/admin/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('✅ Dashboard endpoint successful');
            console.log('Dashboard response keys:', Object.keys(dashboardResponse.data));
            
        } catch (dashError) {
            console.log('❌ Dashboard endpoint failed:', dashError.response?.status, dashError.response?.data?.message);
        }
        
        // Try to understand what's different about the ads endpoint
        console.log('\n3️⃣ Analyzing ads endpoint error...');
        try {
            const adsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads?limit=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('✅ Ads endpoint worked with limit=1!');
            console.log('Response:', JSON.stringify(adsResponse.data, null, 2));
            
        } catch (adsError) {
            console.log('❌ Ads endpoint still fails with limit=1');
            console.log('Status:', adsError.response?.status);
            console.log('Error message:', adsError.response?.data?.message);
            
            // Let's try with different query parameters
            console.log('\n🔍 Trying ads endpoint with no query parameters...');
            try {
                const simpleAdsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('✅ Simple ads request worked!');
                console.log('Response:', JSON.stringify(simpleAdsResponse.data, null, 2));
                
            } catch (simpleError) {
                console.log('❌ Even simple ads request fails');
                console.log('This suggests an issue in the route code itself');
            }
        }
        
    } catch (error) {
        console.log('❌ Setup error:', error.message);
    }
}

debugResponseStructure();