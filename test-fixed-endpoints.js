const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/v2`;

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test endpoints
const endpoints = [
  {
    name: 'Posts API',
    url: '/posts',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Categories API',
    url: '/categories',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Public Settings API',
    url: '/settings/public',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Featured Posts API',
    url: '/posts/featured',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Trending Posts API',
    url: '/posts/trending',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Breaking News API (No Auth)',
    url: '/breaking-news?active=true',
    method: 'GET',
    expectedStatus: 401 // Expected to fail without auth
  }
];

async function testEndpoint(endpoint) {
  try {
    const response = await axios({
      method: endpoint.method,
      url: `${API_BASE}${endpoint.url}`,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });

    const isSuccess = response.status === endpoint.expectedStatus;
    const statusColor = isSuccess ? colors.green : colors.red;
    const statusIcon = isSuccess ? '✅' : '❌';

    console.log(`${statusIcon} ${colors.bold}${endpoint.name}${colors.reset}`);
    console.log(`   Status: ${statusColor}${response.status}${colors.reset}`);
    
    if (response.data) {
      if (response.data.success) {
        console.log(`   ${colors.green}✓ Success: ${response.data.message || 'OK'}${colors.reset}`);
        if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            console.log(`   ${colors.blue}📊 Data: ${response.data.data.length} items${colors.reset}`);
          } else {
            console.log(`   ${colors.blue}📊 Data: Object returned${colors.reset}`);
          }
        }
      } else {
        console.log(`   ${colors.red}✗ Error: ${response.data.error || response.data.message}${colors.reset}`);
      }
    }
    
    console.log('');
    return isSuccess;
    
  } catch (error) {
    console.log(`${colors.red}❌ ${colors.bold}${endpoint.name}${colors.reset}`);
    console.log(`   ${colors.red}✗ Network Error: ${error.message}${colors.reset}`);
    console.log('');
    return false;
  }
}

async function runTests() {
  console.log(`${colors.bold}${colors.blue}🚀 Testing Fixed API Endpoints${colors.reset}`);
  console.log(`${colors.yellow}Testing on: ${BASE_URL}${colors.reset}`);
  console.log('=' .repeat(60));
  console.log('');

  const results = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    results.push({ ...endpoint, success });
  }

  // Summary
  console.log('=' .repeat(60));
  console.log(`${colors.bold}📊 Test Summary${colors.reset}`);
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`${colors.green}✅ Successful: ${successful}/${total}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${total - successful}/${total}${colors.reset}`);
  console.log('');
  
  if (successful < total) {
    console.log(`${colors.bold}🔍 Failed Endpoints:${colors.reset}`);
    results.filter(r => !r.success).forEach(endpoint => {
      console.log(`   ${colors.red}• ${endpoint.name}${colors.reset}`);
    });
    console.log('');
  }
  
  if (successful === total) {
    console.log(`${colors.green}${colors.bold}🎉 All tests passed! The fixes are working correctly.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some endpoints still need attention.${colors.reset}`);
  }
  
  console.log('');
  console.log(`${colors.blue}💡 Note: Breaking News API is expected to return 401 without authentication.${colors.reset}`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error.message);
  process.exit(1);
});