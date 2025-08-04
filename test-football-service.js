const footballService = require('./server/utils/footballService');

async function testFootballService() {
  console.log('🏈 Testing Football Service...');
  console.log('================================');
  
  try {
    // Test 1: Fetch today's matches
    console.log('\n1. Fetching today\'s matches...');
    const todayMatches = await footballService.fetchTodayMatches();
    console.log(`✅ Found ${todayMatches.length || 0} matches for today`);
    
    // Test 2: Fetch important leagues data
    console.log('\n2. Fetching important leagues data...');
    const leaguesData = await footballService.fetchImportantLeaguesData();
    console.log('✅ Important leagues data fetched successfully');
    console.log(`   - Leagues: ${Object.keys(leaguesData.leagues.leagues || {}).length}`);
    console.log(`   - Standings: ${Object.keys(leaguesData.standings.standings || {}).length}`);
    
    // Test 3: Get leagues with matches
    console.log('\n3. Getting leagues with matches...');
    const leaguesWithMatches = await footballService.getLeaguesWithMatches();
    console.log(`✅ Found ${leaguesWithMatches.length} leagues with matches`);
    
    // Display some sample data
    if (leaguesWithMatches.length > 0) {
      console.log('\n📊 Sample League Data:');
      const sampleLeague = leaguesWithMatches[0];
      console.log(`   League: ${sampleLeague.name}`);
      console.log(`   Country: ${sampleLeague.country}`);
      console.log(`   Matches: ${sampleLeague.totalMatches}`);
      
      if (sampleLeague.matches.length > 0) {
        console.log('\n⚽ Sample Match:');
        const sampleMatch = sampleLeague.matches[0];
        console.log(`   ${sampleMatch.homeTeam.name} vs ${sampleMatch.awayTeam.name}`);
        console.log(`   Date: ${new Date(sampleMatch.date).toLocaleDateString()}`);
        console.log(`   Time: ${sampleMatch.time}`);
        console.log(`   Status: ${sampleMatch.status}`);
      }
    }
    
    // Test 4: Get stored matches
    console.log('\n4. Getting stored matches...');
    const storedMatches = await footballService.getStoredMatches();
    console.log(`✅ Found ${storedMatches.length || 0} stored matches`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing football service:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFootballService();