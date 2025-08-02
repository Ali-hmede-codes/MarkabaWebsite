const https = require('https');
const fs = require('fs').promises;
const path = require('path');

/**
 * Weather Service for Lebanon
 * Fetches weather data from WeatherAPI.com and stores it in JSON file
 */
class WeatherService {
  constructor() {
    this.apiKey = 'e8c815c19ac742ba917185014250208';
    this.apiHost = 'api.weatherapi.com';
    this.location = 'Lebanon';
    this.dataFile = path.resolve(__dirname, process.env.WEATHER_DATA_FILE || '../data/weather.json');
  }

  /**
   * Fetch weather data from WeatherAPI.com
   * @returns {Promise<Object>} Weather data
   */
  async fetchWeatherData() {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        hostname: this.apiHost,
        port: null,
        path: `/v1/current.json?key=${this.apiKey}&q=${this.location}&aqi=no`,
        headers: {
          'Content-Type': 'application/json'
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
            
            // Transform WeatherAPI.com response to our format
            const weatherData = {
              temperature: data.current.temp_c,
              condition: data.current.condition.text,
              humidity: data.current.humidity,
              wind_speed: data.current.wind_kph,
              pressure: data.current.pressure_mb,
              visibility: data.current.vis_km,
              lastUpdated: new Date().toISOString(),
              location: {
                country: data.location.country,
                city: data.location.name,
                latitude: data.location.lat,
                longitude: data.location.lon
              }
            };
            
            resolve(weatherData);
          } catch (error) {
            reject(new Error(`Failed to parse weather data: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Weather API request failed: ${error.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Weather API request timeout'));
      });

      req.end();
    });
  }

  /**
   * Save weather data to JSON file
   * @param {Object} weatherData - Weather data to save
   */
  async saveWeatherData(weatherData) {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dataFile);
      await fs.mkdir(dir, { recursive: true });

      // Save weather data
      await fs.writeFile(this.dataFile, JSON.stringify(weatherData, null, 2), 'utf8');
      console.log(`Weather data saved to ${this.dataFile}`);
    } catch (error) {
      throw new Error(`Failed to save weather data: ${error.message}`);
    }
  }

  /**
   * Load weather data from JSON file
   * @returns {Promise<Object|null>} Weather data or null if file doesn't exist
   */
  async loadWeatherData() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to load weather data: ${error.message}`);
    }
  }

  /**
   * Update weather data (fetch and save)
   * @returns {Promise<Object>} Updated weather data
   */
  async updateWeatherData() {
    try {
      console.log('Fetching weather data for Lebanon...');
      const weatherData = await this.fetchWeatherData();
      await this.saveWeatherData(weatherData);
      console.log('Weather data updated successfully');
      return weatherData;
    } catch (error) {
      console.error('Failed to update weather data:', error.message);
      throw error;
    }
  }

  /**
   * Get current weather data (from file or fetch if not available)
   * @returns {Promise<Object>} Weather data
   */
  async getCurrentWeather() {
    try {
      let weatherData = await this.loadWeatherData();
      
      // If no data exists or data is older than 24 hours, fetch new data
      if (!weatherData || WeatherService.isDataStale(weatherData.lastUpdated)) {
        weatherData = await this.updateWeatherData();
      }
      
      return weatherData;
    } catch (error) {
      console.error('Failed to get current weather:', error.message);
      throw error;
    }
  }

  /**
   * Check if weather data is stale (older than 24 hours)
   * @param {string} lastUpdated - ISO timestamp of last update
   * @returns {boolean} True if data is stale
   */
  static isDataStale(lastUpdated) {
    if (!lastUpdated) return true;
    
    const now = new Date();
    const updated = new Date(lastUpdated);
    const hoursDiff = (now - updated) / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  }
}

module.exports = WeatherService;