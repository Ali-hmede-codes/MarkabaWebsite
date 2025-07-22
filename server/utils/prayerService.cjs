import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

class PrayerService {
  constructor() {
    this.apiUrl = 'www.islamicfinder.us';
    this.apiPath = '/index.php/api/prayer_times';
    this.dataFile = process.env.PRAYER_DATA_FILE || path.join(__dirname, '../data/prayer.json');
    
    // Lebanon coordinates and settings
    this.latitude = process.env.PRAYER_LATITUDE || '33.8547';
    this.longitude = process.env.PRAYER_LONGITUDE || '35.8623';
    this.timezone = process.env.PRAYER_TIMEZONE || 'Asia/Beirut';
    this.method = process.env.PRAYER_METHOD || '2'; // Islamic Society of North America
    this.juristic = process.env.PRAYER_JURISTIC || '0'; // Shafi (standard)
    
    this.ensureDataDirectory();
  }

  /**
   * Ensure the data directory exists
   */
  ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created prayer data directory: ${dataDir}`);
    }
  }

  /**
   * Fetch prayer times from Islamic Finder API
   * @param {string} date - Optional date (YYYY-MM-DD format)
   * @param {boolean} showEntireMonth - Whether to fetch entire month
   * @returns {Promise<Object>} Prayer times data
   */
  async fetchPrayerTimes(date = null, showEntireMonth = false) {
    return new Promise((resolve, reject) => {
      console.log('Fetching prayer times for Lebanon...');
      
      // Build query parameters
      const params = new URLSearchParams({
        latitude: this.latitude,
        longitude: this.longitude,
        timezone: this.timezone,
        method: this.method,
        juristic: this.juristic
      });
      
      if (date) {
        params.append('date', date);
      }
      
      if (showEntireMonth) {
        params.append('show_entire_month', '1');
      }
      
      const requestPath = `${this.apiPath}?${params.toString()}`;
      
      const options = {
        hostname: this.apiUrl,
        path: requestPath,
        method: 'GET',
        headers: {
          'User-Agent': 'NewsMarkaba/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const prayerData = JSON.parse(data);
            
            if (!prayerData.success) {
              throw new Error(prayerData.message || 'Failed to fetch prayer times');
            }
            
            const enrichedData = {
              ...prayerData,
              lastUpdated: new Date().toISOString(),
              location: {
                country: 'Lebanon',
                city: 'Beirut',
                latitude: this.latitude,
                longitude: this.longitude,
                timezone: this.timezone
              },
              settings: {
                method: this.method,
                juristic: this.juristic
              }
            };
            
            resolve(enrichedData);
          } catch (error) {
            reject(new Error(`Failed to parse prayer times response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Prayer times API request failed: ${error.message}`));
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Prayer times API request timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Save prayer times data to JSON file
   * @param {Object} data - Prayer times data to save
   */
  async savePrayerData(data) {
    try {
      await fs.promises.writeFile(this.dataFile, JSON.stringify(data, null, 2));
      console.log(`Prayer data saved to ${this.dataFile}`);
    } catch (error) {
      throw new Error(`Failed to save prayer data: ${error.message}`);
    }
  }

  /**
   * Load prayer times data from JSON file
   * @returns {Promise<Object|null>} Prayer times data or null if not found
   */
  async loadPrayerData() {
    try {
      if (!fs.existsSync(this.dataFile)) {
        return null;
      }
      
      const data = await fs.promises.readFile(this.dataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load prayer data:', error.message);
      return null;
    }
  }

  /**
   * Check if prayer data is stale (older than 24 hours)
   * @param {string} lastUpdated - ISO timestamp of last update
   * @returns {boolean} True if data is stale
   */
  static isDataStale(lastUpdated) {
    if (!lastUpdated) return true;
    
    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  }

  /**
   * Update prayer times data (fetch and save)
   * @param {string} date - Optional date
   * @param {boolean} showEntireMonth - Whether to fetch entire month
   * @returns {Promise<Object>} Updated prayer times data
   */
  async updatePrayerData(date = null, showEntireMonth = false) {
    try {
      const prayerData = await this.fetchPrayerTimes(date, showEntireMonth);
      await this.savePrayerData(prayerData);
      console.log('Prayer data updated successfully');
      return prayerData;
    } catch (error) {
      console.error('Failed to update prayer data:', error.message);
      throw error;
    }
  }

  /**
   * Get current prayer times (load from file or fetch if stale)
   * @param {string} date - Optional date
   * @param {boolean} forceUpdate - Force fetch from API
   * @returns {Promise<Object>} Prayer times data
   */
  async getCurrentPrayerTimes(date = null, forceUpdate = false) {
    try {
      if (!forceUpdate) {
        const existingData = await this.loadPrayerData();
        
        if (existingData && !PrayerService.isDataStale(existingData.lastUpdated)) {
          return existingData;
        }
      }
      
      // Data is stale or doesn't exist, fetch new data
      return await this.updatePrayerData(date);
    } catch (error) {
      console.error('Failed to get current prayer times:', error.message);
      
      // Try to return cached data as fallback
      const cachedData = await this.loadPrayerData();
      if (cachedData) {
        console.log('Returning cached prayer data as fallback');
        return cachedData;
      }
      
      throw error;
    }
  }

  /**
   * Get prayer times for entire month
   * @param {string} date - Date in YYYY-MM-DD format (optional)
   * @returns {Promise<Object>} Monthly prayer times data
   */
  async getMonthlyPrayerTimes(date = null) {
    try {
      return await this.fetchPrayerTimes(date, true);
    } catch (error) {
      console.error('Failed to get monthly prayer times:', error.message);
      throw error;
    }
  }
}

export default PrayerService;