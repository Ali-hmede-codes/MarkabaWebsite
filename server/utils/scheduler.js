const cron = require('node-cron');
const WeatherService = require('./weatherService');
const PrayerService = require('./prayerService');
const footballService = require('./footballService');

/**
 * Scheduler Service
 * Handles automated tasks like weather data updates
 */
class Scheduler {
  constructor() {
    this.weatherService = new WeatherService();
    this.prayerService = new PrayerService();
    this.footballService = footballService;
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
    const schedule = process.env.FOOTBALL_UPDATE_SCHEDULE || '0 7 * * *'; // Default: 7:00 AM daily
    
    console.log(`Scheduling football updates with cron: ${schedule}`);
    
    const task = cron.schedule(schedule, async () => {
      try {
        console.log('Running scheduled football update...');
        await this.triggerFootballUpdate();
        console.log('Scheduled football update completed');
      } catch (error) {
        console.error('Error in scheduled football update:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Beirut' // Lebanon timezone
    });
    
    this.tasks.set('footballUpdate', task);
    console.log('Football update scheduler started');
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
   * Get scheduler status
   */
  getStatus() {
    const tasks = Array.from(this.tasks.keys());
    return {
      isRunning: tasks.length > 0,
      activeTasks: tasks,
      weatherSchedule: process.env.WEATHER_UPDATE_SCHEDULE || '0 6 * * *',
      prayerSchedule: process.env.PRAYER_UPDATE_SCHEDULE || '0 5 * * *',
      footballSchedule: process.env.FOOTBALL_UPDATE_SCHEDULE || '0 7 * * *'
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