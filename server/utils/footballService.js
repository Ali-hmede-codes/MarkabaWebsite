const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class FootballService {
  constructor() {
    this.apiKey = 'd4b51a0ca1mshaa66e8709dfeb10p1c83fcjsn1ae435ef0d3b';
    this.apiHost = 'api-football-v1.p.rapidapi.com';
    this.dataDir = path.join(__dirname, '../data');
    this.footballDataFile = path.join(this.dataDir, 'football.json');
    
    // Important leagues to fetch data for
    this.importantLeagues = {
      39: 'Premier League', // England
      140: 'La Liga', // Spain
      135: 'Serie A', // Italy
      78: 'Bundesliga', // Germany
      61: 'Ligue 1', // France
      2: 'UEFA Champions League',
      3: 'UEFA Europa League',
      88: 'Eredivisie', // Netherlands
      94: 'Primeira Liga', // Portugal
      203: 'Süper Lig' // Turkey
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

      const req = https.request(options, (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            const data = JSON.parse(body.toString());
            resolve(data);
          } catch (error) {
            reject(new Error('Failed to parse API response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  async shouldFetchToday() {
    try {
      const footballData = await this.getFootballData();
      const { lastFetch } = footballData;
      const today = new Date().toDateString();
      const lastFetchDate = new Date(lastFetch).toDateString();
      
      return today !== lastFetchDate;
    } catch (error) {
      // File doesn't exist or is corrupted, should fetch
      return true;
    }
  }

  async updateLastFetch() {
    const footballData = await this.getFootballData();
    footballData.lastFetch = new Date().toISOString();
    footballData.timestamp = Date.now();
    
    await this.saveFootballData(footballData);
  }

  async getFootballData() {
    try {
      const data = await fs.readFile(this.footballDataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Return default structure if file doesn't exist
      return {
        lastFetch: null,
        timestamp: null,
        matches: [],
        leagues: [],
        standings: {}
      };
    }
  }

  async saveFootballData(data) {
    await fs.writeFile(this.footballDataFile, JSON.stringify(data, null, 2));
  }

  async fetchTodayMatches() {
    try {
      const shouldFetch = await this.shouldFetchToday();
      
      if (!shouldFetch) {
        // Football data already fetched today
        return await this.getStoredMatches();
      }

      // Fetching today's football matches
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const endpoint = `/v3/fixtures?date=${today}`;
      
      const data = await this.makeRequest(endpoint);
      
      if (data && data.response) {
        const matchesData = {
          date: today,
          fetchedAt: new Date().toISOString(),
          matches: data.response,
          total: data.response.length
        };
        
        // Save to consolidated file
        const footballData = await this.getFootballData();
        footballData.matches = data.response;
        await this.saveFootballData(footballData);
        
        await this.updateLastFetch();
        
        // Successfully fetched matches for today
        return matchesData;
      } 
        throw new Error('Invalid API response format');
      
    } catch (error) {
      throw new Error(`Failed to fetch football matches: ${error.message}`);
    }
  }

  async getStoredMatches() {
    try {
      const footballData = await this.getFootballData();
      return footballData.matches || [];
    } catch (error) {
      // No stored matches found
      return [];
    }
  }

  async getMatchesByLeague(leagueId) {
    const storedData = await this.getStoredMatches();
    if (!storedData.matches || storedData.matches.length === 0) {
      return [];
    }
    
    return storedData.matches.filter(match => 
          match.league && match.league.id === parseInt(leagueId, 10)
        );
  }

  async getMatchesByTeam(teamId) {
    const storedData = await this.getStoredMatches();
    if (!storedData.matches || storedData.matches.length === 0) {
      return [];
    }
    
    return storedData.matches.filter(match => 
          (match.teams.home.id === parseInt(teamId, 10)) || 
          (match.teams.away.id === parseInt(teamId, 10))
        );
  }

  async fetchImportantLeaguesData() {
    try {
      const shouldFetch = await this.shouldFetchToday();
      
      if (!shouldFetch) {
        // League data already fetched today
        return await this.getStoredLeaguesData();
      }

      // Fetching important leagues data
      const leaguesData = {};
      const standingsData = {};
      
      // Fetch data for each important league
      const leagueEntries = Object.entries(this.importantLeagues);
      
      // Process leagues sequentially to avoid rate limiting
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < leagueEntries.length; i += 1) {
        const [leagueId, leagueName] = leagueEntries[i];
        try {
          // Fetching data for league
          
          // Fetch league standings
          const standingsEndpoint = `/v3/standings?league=${leagueId}&season=2024`;
          const standingsResponse = await this.makeRequest(standingsEndpoint);
          
          if (standingsResponse && standingsResponse.response && standingsResponse.response.length > 0) {
            standingsData[leagueId] = {
              league: standingsResponse.response[0].league,
              standings: standingsResponse.response[0].league.standings[0] || []
            };
          }
          
          // Small delay between requests to avoid rate limiting
          await new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
          
          // Fetch league fixtures for next 7 days
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          const fixturesEndpoint = `/v3/fixtures?league=${leagueId}&from=${today.toISOString().split('T')[0]}&to=${nextWeek.toISOString().split('T')[0]}`;
          const fixturesResponse = await this.makeRequest(fixturesEndpoint);
          
          if (fixturesResponse && fixturesResponse.response) {
            leaguesData[leagueId] = {
              id: parseInt(leagueId, 10),
              name: leagueName,
              fixtures: fixturesResponse.response,
              totalFixtures: fixturesResponse.response.length
            };
          }
          
          // Another delay between requests
          await new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
          
        } catch (error) {
          // Error fetching league data - continuing with next league
          // Continue with other leagues even if one fails
        }
      }
      /* eslint-enable no-await-in-loop */
      
      // Save to consolidated file
      const footballData = await this.getFootballData();
      footballData.leagues = {
        fetchedAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        leagues: leaguesData
      };
      footballData.standings = {
        fetchedAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        standings: standingsData
      };
      
      await this.saveFootballData(footballData);
      
      // Successfully fetched important leagues data
      return { leagues: footballData.leagues, standings: footballData.standings };
      
    } catch (error) {
      throw new Error(`Failed to fetch important leagues data: ${error.message}`);
    }
  }

  async getStoredLeaguesData() {
    try {
      const footballData = await this.getFootballData();
      
      return {
        leagues: footballData.leagues || { fetchedAt: null, date: null, leagues: {} },
        standings: footballData.standings || { fetchedAt: null, date: null, standings: {} }
      };
    } catch (error) {
      // No stored leagues data found
      return {
        leagues: { fetchedAt: null, date: null, leagues: {} },
        standings: { fetchedAt: null, date: null, standings: {} }
      };
    }
  }

  async getLeagueStandings(leagueId) {
    const storedData = await this.getStoredLeaguesData();
    return storedData.standings.standings[leagueId] || null;
  }

  async getLeagueFixtures(leagueId) {
    const storedData = await this.getStoredLeaguesData();
    return storedData.leagues.leagues[leagueId] || null;
  }

  async getAllImportantLeagues() {
    const storedData = await this.getStoredLeaguesData();
    return {
      leagues: storedData.leagues.leagues,
      standings: storedData.standings.standings,
      lastUpdate: storedData.leagues.fetchedAt
    };
  }

  async getTopScorers(leagueId, season = 2024) {
    try {
      const endpoint = `/v3/players/topscorers?league=${leagueId}&season=${season}`;
      const response = await this.makeRequest(endpoint);
      
      if (response && response.response) {
        return response.response.slice(0, 10); // Top 10 scorers
      }
      
      return [];
    } catch (error) {
      // Error fetching top scorers - returning empty array
      return [];
    }
  }

  async getLeaguesWithMatches() {
    try {
      const storedData = await this.getStoredLeaguesData();
      const leaguesWithMatches = [];
      
      // Get leagues that have fixtures
      const leagueEntries = Object.entries(storedData.leagues.leagues || {});
      
      for (let i = 0; i < leagueEntries.length; i += 1) {
        const [leagueId, leagueData] = leagueEntries[i];
        if (leagueData.fixtures && leagueData.fixtures.length > 0) {
          // Format matches for display
          const formattedMatches = leagueData.fixtures.map(match => ({
            id: match.fixture.id,
            date: match.fixture.date,
            time: new Date(match.fixture.date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            status: match.fixture.status.short,
            homeTeam: {
              id: match.teams.home.id,
              name: match.teams.home.name,
              logo: match.teams.home.logo
            },
            awayTeam: {
              id: match.teams.away.id,
              name: match.teams.away.name,
              logo: match.teams.away.logo
            },
            score: {
              home: match.goals.home,
              away: match.goals.away
            },
            venue: (match.fixture.venue && match.fixture.venue.name) || 'TBD'
          }));
          
          // Get league info from standings data
          const leagueStandings = storedData.standings.standings[leagueId];
          const leagueInfo = leagueStandings ? leagueStandings.league : null;
          
          leaguesWithMatches.push({
            id: parseInt(leagueId, 10),
            name: leagueData.name,
            logo: (leagueInfo && leagueInfo.logo) || null,
            country: (leagueInfo && leagueInfo.country) || null,
            season: (leagueInfo && leagueInfo.season) || 2024,
            matches: formattedMatches,
            totalMatches: formattedMatches.length
          });
        }
      }
      
      return leaguesWithMatches;
    } catch (error) {
      // Error getting leagues with matches - returning empty array
      return [];
    }
  }
}

module.exports = new FootballService();