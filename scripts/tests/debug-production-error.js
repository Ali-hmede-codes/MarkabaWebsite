const axios = require('axios');

// Test production server with detailed error logging
async function debugProductionError() {
    console.log('🔍 Debugging production server error...');
    
    try {
        // Test 1: Login to production
        console.log('\n1️⃣ Testing login to production...');
        const loginResponse = await axios.post('https://api.markaba.news/api/v2/auth/login', {
            username: 'admin',
            password: 'AdminPass123!'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Debug-Script/1.0'
            }
        });
        
        console.log('✅ Login successful');
        const token = loginResponse.data.token;
        
        // Test 2: Test ads endpoint with detailed error capture
        console.log('\n2️⃣ Testing ads endpoint...');
        try {
            const adsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Debug-Script/1.0'
                },
                timeout: 10000
            });
            
            console.log('✅ Ads endpoint successful');
            console.log('Response:', adsResponse.data);
            
        } catch (adsError) {
            console.log('❌ Ads endpoint failed:');
            console.log('Status:', adsError.response?.status);
            console.log('Status Text:', adsError.response?.statusText);
            console.log('Data:', adsError.response?.data);
            console.log('Headers:', adsError.response?.headers);
            
            if (adsError.response?.status === 500) {
                console.log('\n🔍 500 Error Analysis:');
                console.log('- This is an internal server error');
                console.log('- The error message is in Arabic: "خطأ في الخادم الداخلي"');
                console.log('- This suggests a server-side issue, not authentication');
            }
        }
        
        // Test 3: Test positions endpoint for comparison
        console.log('\n3️⃣ Testing positions endpoint...');
        try {
            const positionsResponse = await axios.get('https://api.markaba.news/api/v2/admin/ads/positions/list', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Debug-Script/1.0'
                },
                timeout: 10000
            });
            
            console.log('✅ Positions endpoint successful');
            console.log('Positions count:', positionsResponse.data.length);
            
        } catch (posError) {
            console.log('❌ Positions endpoint failed:');
            console.log('Status:', posError.response?.status);
            console.log('Data:', posError.response?.data);
        }
        
    } catch (loginError) {
        console.log('❌ Login failed:');
        console.log('Status:', loginError.response?.status);
        console.log('Data:', loginError.response?.data);
        console.log('\n🔍 Login Error Analysis:');
        if (loginError.response?.status === 401) {
            console.log('- Invalid credentials');
            console.log('- Check username/password');
        } else if (loginError.code === 'ENOTFOUND') {
            console.log('- DNS resolution failed');
            console.log('- Check domain name');
        }
    }
}

// Run the debug
debugProductionError().catch(console.error);