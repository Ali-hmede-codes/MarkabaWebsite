const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const footballService = require('../utils/footballService');

const router = express.Router();

// Get today's matches (fetches from API if not already done today)
router.get('/matches/today', async (req, res) => {
  try {
    const matches = await footballService.fetchTodayMatches();
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    // Error fetching today matches
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s matches',
      error: error.message
    });
  }
});

// Get stored matches (without making API call)
router.get('/matches/stored', async (req, res) => {
  try {
    const matches = await footballService.getStoredMatches();
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    // Error getting stored matches
    res.status(500).json({
      success: false,
      message: 'Failed to get stored matches',
      error: error.message
    });
  }
});

// Get matches by league ID
router.get('/matches/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const matches = await footballService.getMatchesByLeague(leagueId);
    res.json({
      success: true,
      data: {
        leagueId: parseInt(leagueId, 10),
        matches: matches,
        total: matches.length
      }
    });
  } catch (error) {
    // Error getting matches by league
    res.status(500).json({
      success: false,
      message: 'Failed to get matches by league',
      error: error.message
    });
  }
});

// Get matches by team ID
router.get('/matches/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const matches = await footballService.getMatchesByTeam(teamId);
    res.json({
      success: true,
      data: {
        teamId: parseInt(teamId, 10),
        matches: matches,
        total: matches.length
      }
    });
  } catch (error) {
    // Error getting matches by team
    res.status(500).json({
      success: false,
      message: 'Failed to get matches by team',
      error: error.message
    });
  }
});

// Force refresh matches (admin only - bypasses daily limit)
router.post('/matches/refresh', async (req, res) => {
  try {
    // Remove the last fetch record to force a new fetch
    const lastFetchFile = path.join(__dirname, '../data/football_last_fetch.json');
    
    try {
      await fs.unlink(lastFetchFile);
    } catch (error) {
      // File might not exist, that's okay
    }
    
    const matches = await footballService.fetchTodayMatches();
    res.json({
      success: true,
      message: 'Matches refreshed successfully',
      data: matches
    });
  } catch (error) {
    // Error refreshing matches
    res.status(500).json({
      success: false,
      message: 'Failed to refresh matches',
      error: error.message
    });
  }
});

// Get all important leagues data
router.get('/leagues/important', async (req, res) => {
  try {
    const leaguesData = await footballService.getAllImportantLeagues();
    res.json({
      success: true,
      data: leaguesData
    });
  } catch (error) {
    // Error getting important leagues
    res.status(500).json({
      success: false,
      message: 'Failed to get important leagues data',
      error: error.message
    });
  }
});

// Fetch fresh important leagues data
router.post('/leagues/fetch', async (req, res) => {
  try {
    const leaguesData = await footballService.fetchImportantLeaguesData();
    res.json({
      success: true,
      message: 'Important leagues data fetched successfully',
      data: leaguesData
    });
  } catch (error) {
    // Error fetching important leagues
    res.status(500).json({
      success: false,
      message: 'Failed to fetch important leagues data',
      error: error.message
    });
  }
});

// Get league standings by ID
router.get('/leagues/:leagueId/standings', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const standings = await footballService.getLeagueStandings(leagueId);
    
    if (!standings) {
      return res.status(404).json({
        success: false,
        message: 'Standings not found for this league'
      });
    }
    
    res.json({
      success: true,
      data: standings
    });
  } catch (error) {
    // Error getting league standings
    res.status(500).json({
      success: false,
      message: 'Failed to get league standings',
      error: error.message
    });
  }
});

// Get league fixtures by ID
router.get('/leagues/:leagueId/fixtures', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const fixtures = await footballService.getLeagueFixtures(leagueId);
    
    if (!fixtures) {
      return res.status(404).json({
        success: false,
        message: 'Fixtures not found for this league'
      });
    }
    
    res.json({
      success: true,
      data: fixtures
    });
  } catch (error) {
    // Error getting league fixtures
    res.status(500).json({
      success: false,
      message: 'Failed to get league fixtures',
      error: error.message
    });
  }
});

// Get top scorers for a league
router.get('/leagues/:leagueId/topscorers', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { season = 2024 } = req.query;
    const topScorers = await footballService.getTopScorers(leagueId, season);
    
    res.json({
      success: true,
      data: {
        leagueId: parseInt(leagueId, 10),
        season: parseInt(season, 10),
        topScorers: topScorers
      }
    });
  } catch (error) {
    // Error getting top scorers
    res.status(500).json({
      success: false,
      message: 'Failed to get top scorers',
      error: error.message
    });
  }
});

// Get leagues with matches only (simplified view)
router.get('/leagues-with-matches', async (req, res) => {
  try {
    const leaguesWithMatches = await footballService.getLeaguesWithMatches();
    
    res.json({
      success: true,
      data: leaguesWithMatches,
      count: leaguesWithMatches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Error getting leagues with matches
    res.status(500).json({
      success: false,
      error: 'Failed to get leagues with matches'
    });
  }
});

// Get API status and last fetch info
router.get('/status', async (req, res) => {
  try {
    const lastFetchFile = path.join(__dirname, '../data/football_last_fetch.json');
    const matchesFile = path.join(__dirname, '../data/football_matches.json');
    const leaguesFile = path.join(__dirname, '../data/football_leagues.json');
    const standingsFile = path.join(__dirname, '../data/football_standings.json');
    
    let lastFetchInfo = null;
    let matchesInfo = null;
    let leaguesInfo = null;
    let standingsInfo = null;
    
    try {
      const lastFetchData = await fs.readFile(lastFetchFile, 'utf8');
      lastFetchInfo = JSON.parse(lastFetchData);
    } catch (error) {
      // File doesn't exist
    }
    
    try {
      const matchesData = await fs.readFile(matchesFile, 'utf8');
      const matches = JSON.parse(matchesData);
      matchesInfo = {
        date: matches.date,
        fetchedAt: matches.fetchedAt,
        totalMatches: matches.total
      };
    } catch (error) {
      // File doesn't exist
    }
    
    try {
      const leaguesData = await fs.readFile(leaguesFile, 'utf8');
      const leagues = JSON.parse(leaguesData);
      leaguesInfo = {
        date: leagues.date,
        fetchedAt: leagues.fetchedAt,
        totalLeagues: Object.keys(leagues.leagues || {}).length
      };
    } catch (error) {
      // File doesn't exist
    }
    
    try {
      const standingsData = await fs.readFile(standingsFile, 'utf8');
      const standings = JSON.parse(standingsData);
      standingsInfo = {
        date: standings.date,
        fetchedAt: standings.fetchedAt,
        totalStandings: Object.keys(standings.standings || {}).length
      };
    } catch (error) {
      // File doesn't exist
    }
    
    res.json({
      success: true,
      data: {
        lastFetch: lastFetchInfo,
        storedMatches: matchesInfo,
        storedLeagues: leaguesInfo,
        storedStandings: standingsInfo,
        canFetchToday: await footballService.shouldFetchToday(),
        importantLeagues: {
          39: 'Premier League',
          140: 'La Liga',
          135: 'Serie A',
          78: 'Bundesliga',
          61: 'Ligue 1',
          2: 'UEFA Champions League',
          3: 'UEFA Europa League',
          88: 'Eredivisie',
          94: 'Primeira Liga',
          203: 'Süper Lig'
        }
      }
    });
  } catch (error) {
    // Error getting status
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    });
  }
});

module.exports = router;