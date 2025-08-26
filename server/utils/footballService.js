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
      3: 'UEFA Europa League'
    };
    
    // Daily API request management
    this.maxDailyRequests = 100;
    this.dailyRequestCount = 0;
    this.lastRequestReset = null;
    // With 24 hourly updates, we can make ~4 requests per hour (96 total)
    // This leaves some buffer for manual refreshes
    this.requestsPerHour = 4;
    this.maxHourlyRequests = 4;
  }

  async makeRequest(endpoint) {
    // Check if we can make the request
    if (!this.canMakeRequest()) {
      throw new Error(`Daily API request limit reached (${this.maxDailyRequests}). Try again tomorrow.`);
    }

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
            // Increment request count on successful request
            this.incrementRequestCount();
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

  /**
   * Check if we can make more API requests today
   */
  canMakeRequest() {
    this.resetDailyCountIfNeeded();
    return this.dailyRequestCount < this.maxDailyRequests;
  }

  /**
   * Reset daily request count if it's a new day
   */
  resetDailyCountIfNeeded() {
    const today = new Date().toDateString();
    const lastReset = this.lastRequestReset ? new Date(this.lastRequestReset).toDateString() : null;
    
    if (today !== lastReset) {
      this.dailyRequestCount = 0;
      this.lastRequestReset = new Date().toISOString();
      console.log('Daily API request count reset for football service');
    }
  }

  /**
   * Increment daily request count
   */
  incrementRequestCount() {
    this.resetDailyCountIfNeeded();
    this.dailyRequestCount += 1;
    console.log(`Football API requests today: ${this.dailyRequestCount}/${this.maxDailyRequests}`);
  }

  /**
   * Check if it's time for a scheduled refresh
   */
  isScheduledRefreshTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return this.refreshIntervals.some(interval => 
      interval.hour === currentHour && Math.abs(interval.minute - currentMinute) <= 5
    );
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

  /**
   * Distributed daily refresh - fetches data multiple times per day
   */
  async distributedDailyRefresh() {
    try {
      console.log('Starting distributed daily football refresh...');
      
      if (!this.canMakeRequest()) {
        console.log('Daily API request limit reached, skipping refresh');
        return await this.getStoredMatches();
      }

      const today = new Date().toISOString().split('T')[0];
      const allMatches = [];
      const leagueIds = Object.keys(this.importantLeagues);
      
      // Calculate how many requests we can make this refresh
      const requestsPerRefresh = Math.min(this.maxHourlyRequests, leagueIds.length);
      
      console.log(`Making up to ${requestsPerRefresh} requests this refresh`);
      
      // Process a subset of leagues to distribute requests throughout the day
      const currentHour = new Date().getHours();
      const startIndex = (currentHour % leagueIds.length);
      
      const processDistributedLeague = async (leagueId) => {
        try {
          const currentSeason = new Date().getFullYear();
          const endpoint = `/v3/fixtures?league=${leagueId}&date=${today}&season=${currentSeason}`;
          const data = await this.makeRequest(endpoint);
          
          if (data && data.response && data.response.length > 0) {
            console.log(`Fetched ${data.response.length} matches for ${this.importantLeagues[leagueId]}`);
            return data.response;
          }
          
          return [];
        } catch (error) {
          console.error(`Error fetching data for league ${leagueId}:`, error.message);
          return [];
        }
      };
      
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < requestsPerRefresh && i < leagueIds.length; i += 1) {
        const leagueIndex = (startIndex + i) % leagueIds.length;
        const leagueId = leagueIds[leagueIndex];
        
        const matches = await processDistributedLeague(leagueId);
        allMatches.push(...matches);
        
        // Delay between requests
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }
      /* eslint-enable no-await-in-loop */

      // Update stored data with daily reset logic
      const footballData = await this.getFootballData();
      
      // Check if we need to clear old data (new day)
      const lastFetchDate = footballData.lastFetch ? new Date(footballData.lastFetch).toISOString().split('T')[0] : null;
      const isNewDay = !lastFetchDate || lastFetchDate !== today;
      
      if (isNewDay) {
        console.log('New day detected - clearing old matches data');
        // Clear old matches and start fresh for the new day
        footballData.matches = allMatches;
      } else {
        // Same day - filter out old matches and merge with new ones
        const todayMatches = footballData.matches.filter(match => {
          const matchDate = new Date(match.fixture.date).toISOString().split('T')[0];
          return matchDate === today;
        });
        
        // Merge new matches with today's existing ones, avoiding duplicates
        const existingMatchIds = new Set(todayMatches.map(match => match.fixture.id));
        const newMatches = allMatches.filter(match => !existingMatchIds.has(match.fixture.id));
        
        footballData.matches = [...todayMatches, ...newMatches];
      }
      
      footballData.lastFetch = new Date().toISOString();
      footballData.timestamp = Date.now();
      
      await this.saveFootballData(footballData);
      
      console.log(`Distributed refresh completed. Total today's matches: ${footballData.matches.length}`);
      return footballData.matches;
      
    } catch (error) {
      console.error('Error in distributed daily refresh:', error.message);
      return await this.getStoredMatches();
    }
  }

  async fetchTodayMatches() {
    try {
      const shouldFetch = await this.shouldFetchToday();
      
      if (!shouldFetch) {
        // Football data already fetched today
        return await this.getStoredMatches();
      }

      // Fetching today's football matches for important leagues only
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const allMatches = [];
      
      // Fetch matches for each important league
      const leagueIds = Object.keys(this.importantLeagues);
      
      // Process leagues sequentially to avoid rate limiting
      const processLeague = async (leagueId) => {
        try {
          const currentSeason = new Date().getFullYear();
          const endpoint = `/v3/fixtures?league=${leagueId}&date=${today}&season=${currentSeason}`;
          const data = await this.makeRequest(endpoint);
          
          if (data && data.response && data.response.length > 0) {
            return data.response;
          }
          
          return [];
        } catch (error) {
          console.error(`Failed to fetch matches for league ${leagueId}:`, error.message);
          return [];
        }
      };
      
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < leagueIds.length; i += 1) {
        const leagueId = leagueIds[i];
        const matches = await processLeague(leagueId);
        allMatches.push(...matches);
        
        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      }
      /* eslint-enable no-await-in-loop */
      
      // Get existing data and implement daily reset logic
      const existingData = await this.getFootballData();
      const lastFetchDate = existingData.lastFetch ? new Date(existingData.lastFetch).toISOString().split('T')[0] : null;
      const isNewDay = !lastFetchDate || lastFetchDate !== today;
      
      let finalMatches;
      if (isNewDay) {
        console.log('New day detected in fetchTodayMatches - starting fresh');
        finalMatches = allMatches;
      } else {
        // Same day - merge with existing today's matches
        const todayMatches = existingData.matches.filter(match => {
          const matchDate = new Date(match.fixture.date).toISOString().split('T')[0];
          return matchDate === today;
        });
        
        const existingMatchIds = new Set(todayMatches.map(match => match.fixture.id));
        const newMatches = allMatches.filter(match => !existingMatchIds.has(match.fixture.id));
        finalMatches = [...todayMatches, ...newMatches];
      }
      
      // Store the updated data
      const footballData = {
        lastFetch: new Date().toISOString(),
        timestamp: Date.now(),
        matches: finalMatches,
        leagues: existingData.leagues || {},
        standings: existingData.standings || {}
      };
      
      await this.saveFootballData(footballData);
      
      console.log(`Fetched and stored ${finalMatches.length} matches for today from ${leagueIds.length} leagues`);
      return finalMatches;
      
    } catch (error) {
      throw new Error(`Failed to fetch football matches: ${error.message}`);
    }
  }

  async getStoredMatches() {
    try {
      const footballData = await this.getFootballData();
      const allMatches = footballData.matches || [];
      
      // Filter matches to only include important leagues
      const importantLeagueIds = Object.keys(this.importantLeagues).map(id => parseInt(id, 10));
      const filteredMatches = allMatches.filter(match => 
        match.league && importantLeagueIds.includes(match.league.id)
      );
      
      return filteredMatches;
    } catch (error) {
      // No stored matches found
      return [];
    }
  }

  async getMatchesByLeague(leagueId) {
    const storedMatches = await this.getStoredMatches();
    if (!storedMatches || storedMatches.length === 0) {
      return [];
    }
    
    return storedMatches.filter(match => 
          match.league && match.league.id === parseInt(leagueId, 10)
        );
  }

  async getMatchesByTeam(teamId) {
    const storedMatches = await this.getStoredMatches();
    if (!storedMatches || storedMatches.length === 0) {
      return [];
    }
    
    return storedMatches.filter(match => 
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
      const processLeagueData = async (leagueId, leagueName) => {
        try {
          // Fetch league standings
          const standingsEndpoint = `/v3/standings?league=${leagueId}&season=2024`;
          const standingsResponse = await this.makeRequest(standingsEndpoint);
          
          let standings = null;
          if (standingsResponse && standingsResponse.response && standingsResponse.response.length > 0) {
            standings = {
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
          
          let fixtures = null;
          if (fixturesResponse && fixturesResponse.response) {
            fixtures = {
              id: parseInt(leagueId, 10),
              name: leagueName,
              fixtures: fixturesResponse.response,
              totalFixtures: fixturesResponse.response.length
            };
          }
          
          return { standings, fixtures };
        } catch (error) {
          console.error(`Error fetching league data for ${leagueId}:`, error.message);
          return { standings: null, fixtures: null };
        }
      };
      
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < leagueEntries.length; i += 1) {
        const [leagueId, leagueName] = leagueEntries[i];
        const { standings, fixtures } = await processLeagueData(leagueId, leagueName);
        
        if (standings) {
          standingsData[leagueId] = standings;
        }
        
        if (fixtures) {
          leaguesData[leagueId] = fixtures;
        }
        
        // Another delay between requests
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
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