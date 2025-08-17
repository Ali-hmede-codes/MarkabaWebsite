const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class FootballDebugger {
  constructor() {
    this.apiKey = 'd4b51a0ca1mshaa66e8709dfeb10p1c83fcjsn1ae435ef0d3b';
    this.apiHost = 'api-football-v1.p.rapidapi.com';
    this.importantLeagues = {
      39: 'Premier League', // England
      140: 'La Liga', // Spain
      135: 'Serie A', // Italy
      78: 'Bundesliga', // Germany
      61: 'Ligue 1', // France
      2: 'UEFA Champions League',
      3: 'UEFA Europa League'
    };
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        hostname: this.apiHost,
        port: null,
        path: endpoint,
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost
        }
      };

      console.log(`Making request to: https://${this.apiHost}${endpoint}`);

      const req = https.request(options, (res) => {
        const chunks = [];
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response headers:`, res.headers);

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            const bodyString = body.toString();
            console.log(`Response body length: ${bodyString.length}`);
            console.log(`Response body preview: ${bodyString.substring(0, 500)}...`);
            
            const data = JSON.parse(bodyString);
            resolve(data);
          } catch (error) {
            console.error('Failed to parse response:', error.message);
            console.error('Raw response:', body.toString());
            reject(new Error('Failed to parse API response'));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error.message);
        reject(error);
      });

      req.end();
    });
  }

  async testSingleLeague(leagueId, leagueName) {
    console.log(`\n🏈 Testing ${leagueName} (ID: ${leagueId})`);
    const today = new Date().toISOString().split('T')[0];
    console.log(`Date: ${today}`);
    
    try {
      const currentSeason = new Date().getFullYear();
      const endpoint = `/v3/fixtures?league=${leagueId}&date=${today}&season=${currentSeason}`;
      const data = await this.makeRequest(endpoint);
      
      console.log(`✅ API Response for ${leagueName}:`);
      console.log(`- Success: ${data.success || 'undefined'}`);
      console.log(`- Results count: ${data.results || 'undefined'}`);
      console.log(`- Response length: ${data.response ? data.response.length : 'undefined'}`);
      console.log(`- Errors: ${data.errors ? JSON.stringify(data.errors) : 'none'}`);
      
      if (data.response && data.response.length > 0) {
        console.log(`- Sample match:`, {
          id: data.response[0].fixture.id,
          date: data.response[0].fixture.date,
          homeTeam: data.response[0].teams.home.name,
          awayTeam: data.response[0].teams.away.name,
          status: data.response[0].fixture.status.short
        });
      }
      
      return data.response || [];
    } catch (error) {
      console.error(`❌ Error fetching ${leagueName}:`, error.message);
      return [];
    }
  }

  async testAllLeagues() {
    console.log('🏈 Testing Football API for all leagues...');
    console.log(`API Key: ${this.apiKey.substring(0, 10)}...`);
    console.log(`API Host: ${this.apiHost}`);
    
    const allMatches = [];
    const leagueEntries = Object.entries(this.importantLeagues);
    
    for (const [leagueId, leagueName] of leagueEntries) {
      const matches = await this.testSingleLeague(leagueId, leagueName);
      allMatches.push(...matches);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total matches found: ${allMatches.length}`);
    console.log(`- Leagues tested: ${leagueEntries.length}`);
    
    return allMatches;
  }
}

async function runTest() {
  const debug = new FootballDebugger();
  await debug.testAllLeagues();
}

runTest().catch(console.error);