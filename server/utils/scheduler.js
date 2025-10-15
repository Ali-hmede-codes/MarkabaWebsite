const cron = require('node-cron');
const WeatherService = require('./weatherService');
const PrayerService = require('./prayerService');
const footballService = require('./footballService');
const NewsCleanupService = require('../services/newsCleanupService');

/**
 * Scheduler Service
 * Handles automated tasks like weather data updates
 */
class Scheduler {
  constructor() {
    this.weatherService = new WeatherService();
    this.prayerService = new PrayerService();
    this.footballService = footballService;
    this.newsCleanupService = new NewsCleanupService();
    this.tasks = new Map();
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    console.log('Starting scheduler service...');
    this.startWeatherUpdates();
    this.startPrayerUpdates();
    this.startFootballUpdates();
    this.startNewsCleanup();
    console.log('Scheduler service started successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    console.log('Stopping scheduler service...');
    this.tasks.forEach((task, name) => {
      if (task && typeof task.stop === 'function') {
        task.stop();
        console.log(`Stopped task: ${name}`);
      }
    });
    this.tasks.clear();
    console.log('Scheduler service stopped');
  }

  /**
   * Start weather data update scheduler
   */
  startWeatherUpdates() {
    const schedule = process.env.WEATHER_UPDATE_SCHEDULE || '0 6 * * *'; // Default: 6:00 AM daily
    
    console.log(`Scheduling weather updates with cron: ${schedule}`);
    
    const task = cron.schedule(schedule, async () => {
      try {
        console.log('Running scheduled weather update...');
        await this.weatherService.updateWeatherData();
        console.log('Scheduled weather update completed successfully');
      } catch (error) {
        console.error('Scheduled weather update failed:', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Beirut' // Lebanon timezone
    });

    this.tasks.set('weatherUpdate', task);
    console.log('Weather update scheduler started');
  }

  /**
   * Start prayer times update scheduler
   */
  startPrayerUpdates() {
    const schedule = process.env.PRAYER_UPDATE_SCHEDULE || '0 5 * * *'; // Default: 5:00 AM daily
    
    console.log(`Scheduling prayer times updates with cron: ${schedule}`);
    
    const task = cron.schedule(schedule, async () => {
      try {
        console.log('Running scheduled prayer times update...');
        await this.prayerService.updatePrayerData();
        console.log('Scheduled prayer times update completed successfully');
      } catch (error) {
        console.error('Scheduled prayer times update failed:', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Beirut' // Lebanon timezone
    });

    this.tasks.set('prayerUpdate', task);
    console.log('Prayer times update scheduler started');
  }

  /**
   * Start football data update scheduler
   */
  startFootballUpdates() {
    const timezone = process.env.TIMEZONE || 'Asia/Beirut';
    
    // Schedule hourly updates (24 times per day)
    console.log('Scheduling football hourly updates: 0 * * * * (every hour)');
    const hourlyTask = cron.schedule('0 * * * *', async () => {
      const currentHour = new Date().getHours();
      console.log(`Running hourly football data refresh (hour ${currentHour})...`);
      try {
        // Reset daily request count at midnight
        if (currentHour === 0) {
          this.footballService.resetDailyCountIfNeeded();
          console.log('Daily request count reset at midnight');
        }
        
        await this.footballService.distributedDailyRefresh();
        console.log(`Hourly football refresh completed successfully (hour ${currentHour})`);
      } catch (error) {
        console.error(`Hourly football refresh failed (hour ${currentHour}):`, error.message);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });

    // Keep a backup daily refresh at 6 AM in case hourly updates fail
    const backupSchedule = process.env.FOOTBALL_BACKUP_SCHEDULE || '0 6 * * *';
    console.log(`Scheduling backup football update: ${backupSchedule} (${timezone})`);
    
    const backupTask = cron.schedule(backupSchedule, async () => {
      console.log('Running backup scheduled football data update...');
      try {
        await this.triggerFootballUpdate();
        console.log('Backup scheduled football update completed successfully');
      } catch (error) {
        console.error('Backup scheduled football update failed:', error.message);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });
    
    this.tasks.set('footballHourlyUpdate', hourlyTask);
    this.tasks.set('footballBackupUpdate', backupTask);
    console.log('Football update scheduler started with hourly refreshes (24 times per day)');
  }

  /**
   * Start news cleanup scheduler
   * Runs daily at 2:00 AM to clean up old news entries
   */
  startNewsCleanup() {
    const schedule = process.env.NEWS_CLEANUP_SCHEDULE || '0 2 * * *'; // Default: 2:00 AM daily
    
    console.log(`Scheduling news cleanup with cron: ${schedule}`);
    
    const task = cron.schedule(schedule, async () => {
      try {
        console.log('🧹 Starting scheduled news cleanup...');
        const results = await this.newsCleanupService.runDailyCleanup(2);
        console.log('✅ Scheduled news cleanup completed:', results);
      } catch (error) {
        console.error('❌ Scheduled news cleanup failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'Asia/Riyadh'
    });
    
    task.start();
    this.tasks.set('newsCleanup', task);
    console.log('News cleanup scheduler started - will run daily at 2:00 AM');
  }

  /**
   * Manually trigger weather update
   */
  async triggerWeatherUpdate() {
    try {
      console.log('Manually triggering weather update...');
      await this.weatherService.updateWeatherData();
      console.log('Manual weather update completed successfully');
      return true;
    } catch (error) {
      console.error('Manual weather update failed:', error.message);
      throw error;
    }
  }

  /**
   * Manually trigger prayer times update
   */
  async triggerPrayerUpdate() {
    try {
      console.log('Manually triggering prayer times update...');
      await this.prayerService.updatePrayerData();
      console.log('Manual prayer times update completed successfully');
      return true;
    } catch (error) {
      console.error('Manual prayer times update failed:', error.message);
      throw error;
    }
  }

  /**
   * Manually trigger football data update
   */
  async triggerFootballUpdate() {
    try {
      console.log('Manually triggering football data update...');
      const result = await this.footballService.fetchTodayMatches();
      console.log('Manual football data update completed successfully');
      return { success: true, message: 'Football data updated successfully', data: result };
    } catch (error) {
      console.error('Manual football data update failed:', error.message);
      throw error;
    }
  }

  /**
   * Manually trigger news cleanup
   */
  async triggerNewsCleanup() {
    try {
      console.log('Manually triggering news cleanup...');
      const results = await this.newsCleanupService.runDailyCleanup(2);
      console.log('Manual news cleanup completed successfully');
      return { success: true, message: 'News cleanup completed successfully', data: results };
    } catch (error) {
      console.error('Manual news cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const activeTasks = [];
    
    this.tasks.forEach((task, name) => {
      activeTasks.push({
        name,
        running: task.running || false,
        scheduled: true
      });
    });
    
    return {
      activeTasks,
      totalTasks: this.tasks.size,
      schedules: {
        weather: process.env.WEATHER_UPDATE_SCHEDULE || '0 6 * * *',
        prayer: process.env.PRAYER_UPDATE_SCHEDULE || '0 5 * * *',
        newsCleanup: process.env.NEWS_CLEANUP_SCHEDULE || '0 2 * * *',
        footballMidnight: '0 0 * * *',
        footballMorning: '0 6 * * *',
        footballNoon: '0 12 * * *',
        footballEvening: '0 18 * * *',
        footballNight: '0 21 * * *',
        footballBackup: process.env.FOOTBALL_UPDATE_SCHEDULE || '0 7 * * *'
      },
      footballApiLimits: {
        maxDailyRequests: (this.footballService && this.footballService.maxDailyRequests) || 100,
        currentDailyCount: (this.footballService && this.footballService.dailyRequestCount) || 0,
        lastReset: (this.footballService && this.footballService.lastRequestReset) || null
      }
    };
  }

  /**
   * Initialize weather data on startup if not exists
   */
  async initializeWeatherData() {
    try {
      const existingData = await this.weatherService.loadWeatherData();
      
      if (!existingData) {
        console.log('No weather data found. Fetching initial data...');
        await this.weatherService.updateWeatherData();
        console.log('Initial weather data fetched successfully');
      } else {
        console.log('Weather data already exists. Last updated:', existingData.lastUpdated);
        
        // Check if data is stale and update if needed
        if (WeatherService.isDataStale(existingData.lastUpdated)) {
          console.log('Weather data is stale. Updating...');
          await this.weatherService.updateWeatherData();
        }
      }
    } catch (error) {
      console.error('Failed to initialize weather data:', error.message);
    }
  }

  /**
   * Initialize prayer times data on startup if not exists
   */
  async initializePrayerData() {
    try {
      const existingData = await this.prayerService.loadPrayerData();
      
      if (!existingData) {
        console.log('No prayer times data found. Fetching initial data...');
        await this.prayerService.updatePrayerData();
        console.log('Initial prayer times data fetched successfully');
      } else {
        console.log('Prayer times data already exists. Last updated:', existingData.lastUpdated);
        
        // Check if data is stale and update if needed
        if (PrayerService.isDataStale(existingData.lastUpdated)) {
          console.log('Prayer times data is stale. Updating...');
          await this.prayerService.updatePrayerData();
        }
      }
    } catch (error) {
      console.error('Failed to initialize prayer times data:', error.message);
    }
  }
}

module.exports = Scheduler;