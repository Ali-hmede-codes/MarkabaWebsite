const footballService = require('./server/utils/footballService');
const express = require('express');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function testFootballAPI() {
  console.log('Testing Football API...');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Check if we should fetch today
    console.log('\n1. Checking if we should fetch today...');
    const shouldFetch = await footballService.shouldFetchToday();
    console.log('Should fetch today:', shouldFetch);
    
    // Test 2: Get stored matches (if any)
    console.log('\n2. Getting stored matches...');
    const storedMatches = await footballService.getStoredMatches();
    console.log('Stored matches count:', storedMatches.total || 0);
    console.log('Stored matches date:', storedMatches.date || 'N/A');
    
    // Test 3: Fetch today's matches (will make API call if needed)
    console.log('\n3. Fetching today\'s matches...');
    const todayMatches = await footballService.fetchTodayMatches();
    console.log('Today\'s matches count:', todayMatches.total || 0);
    console.log('Fetch date:', todayMatches.date);
    console.log('Fetched at:', todayMatches.fetchedAt);
    
    // Test 4: Show sample matches (first 3)
    if (todayMatches.matches && todayMatches.matches.length > 0) {
      console.log('\n4. Sample matches:');
      todayMatches.matches.slice(0, 3).forEach((match, index) => {
        console.log(`\nMatch ${index + 1}:`);
        console.log(`  League: ${match.league?.name || 'Unknown'}`);
        console.log(`  Home: ${match.teams?.home?.name || 'Unknown'}`);
        console.log(`  Away: ${match.teams?.away?.name || 'Unknown'}`);
        console.log(`  Date: ${match.fixture?.date || 'Unknown'}`);
        console.log(`  Status: ${match.fixture?.status?.long || 'Unknown'}`);
      });
    } else {
      console.log('\n4. No matches found for today');
    }
    
    // Test 5: Test filtering by league (if matches exist)
    if (todayMatches.matches && todayMatches.matches.length > 0) {
      const firstMatch = todayMatches.matches[0];
      if (firstMatch.league && firstMatch.league.id) {
        console.log('\n5. Testing league filter...');
        const leagueMatches = await footballService.getMatchesByLeague(firstMatch.league.id);
        console.log(`Matches for league ${firstMatch.league.name}:`, leagueMatches.length);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Football API test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Football API test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test the Express routes
async function testExpressRoutes() {
  console.log('\n\nTesting Express Routes...');
  console.log('='.repeat(50));
  
  const app = express();
  app.use(express.json());
  
  // Import and use football routes
  const footballRoutes = require('./server/routes/football_enhanced');
  app.use('/api/football', footballRoutes);
  
  const server = app.listen(3001, () => {
    console.log('Test server running on port 3001');
    console.log('\nAvailable endpoints:');
    console.log('- GET http://localhost:3001/api/football/matches/today');
    console.log('- GET http://localhost:3001/api/football/matches/stored');
    console.log('- GET http://localhost:3001/api/football/status');
    console.log('- POST http://localhost:3001/api/football/matches/refresh');
    console.log('\nPress Ctrl+C to stop the test server');
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down test server...');
    server.close(() => {
      console.log('Test server stopped');
      process.exit(0);
    });
  });
}

// Run tests
async function runTests() {
  await testFootballAPI();
  await testExpressRoutes();
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFootballAPI, testExpressRoutes };