const fs = require('fs');
const path = require('path');

class PrayerService {
  constructor() {
    this.apiBase = 'https://api.aladhan.com/v1';
    this.dataFile = process.env.PRAYER_DATA_FILE || path.join(__dirname, '../data/prayer.json');
    this.city = process.env.PRAYER_CITY || 'Beirut';
    this.country = process.env.PRAYER_COUNTRY || 'Lebanon';
    this.state = process.env.PRAYER_STATE || 'Beirut';
    this.latitude = process.env.PRAYER_LATITUDE || '33.8547';
    this.longitude = process.env.PRAYER_LONGITUDE || '35.8623';
    this.timezone = process.env.PRAYER_TIMEZONE || 'Asia/Beirut';
    this.method = process.env.PRAYER_METHOD || '3';
    this.school = process.env.PRAYER_SCHOOL || process.env.PRAYER_JURISTIC || '0';
    this.shafaq = process.env.PRAYER_SHAFAQ || 'general';
    this.midnightMode = process.env.PRAYER_MIDNIGHT_MODE || '0';
    this.latitudeAdjustmentMethod = process.env.PRAYER_LAT_ADJ || '1';
    this.calendarMethod = process.env.PRAYER_CALENDAR_METHOD || 'UAQ';
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  todayInBeirut() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(new Date());
    const day = parts.find((part) => part.type === 'day')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const year = parts.find((part) => part.type === 'year')?.value;
    return { day, month, year, iso: `${year}-${month}-${day}`, path: `${day}-${month}-${year}` };
  }

  toAladhanDate(date) {
    if (!date) {
      return this.todayInBeirut().path;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return date;
    }
    return this.todayInBeirut().path;
  }

  queryParams() {
    return {
      city: this.city,
      country: this.country,
      state: this.state,
      method: this.method,
      shafaq: this.shafaq,
      school: this.school,
      midnightMode: this.midnightMode,
      timezonestring: this.timezone,
      latitudeAdjustmentMethod: this.latitudeAdjustmentMethod,
      calendarMethod: this.calendarMethod,
      iso8601: 'false',
    };
  }

  formatDisplayTime(hhmm) {
    const clean = String(hhmm || '').split(' ')[0];
    const [hourRaw, minuteRaw] = clean.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return '';
    }
    const suffix = hour >= 12 ? '%pm%' : '%am%';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

  addMinutes(hhmm, minutesToAdd) {
    const clean = String(hhmm || '').split(' ')[0];
    const [hourRaw, minuteRaw] = clean.split(':');
    const total = Number(hourRaw) * 60 + Number(minuteRaw) + minutesToAdd;
    const hour = Math.floor((total + 1440) % 1440 / 60);
    const minute = (total + 1440) % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  mapTimings(timings) {
    const sunrise = timings.Sunrise || timings.sunrise;
    const duha = timings.Duha || timings.Ishraq || (sunrise ? this.addMinutes(sunrise, 20) : '');
    return {
      Fajr: this.formatDisplayTime(timings.Fajr),
      Duha: this.formatDisplayTime(duha),
      Dhuhr: this.formatDisplayTime(timings.Dhuhr),
      Asr: this.formatDisplayTime(timings.Asr),
      Maghrib: this.formatDisplayTime(timings.Maghrib),
      Isha: this.formatDisplayTime(timings.Isha),
    };
  }

  async fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'NewsMarkaba/1.0',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Aladhan HTTP ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async fetchPrayerTimes(date = null, showEntireMonth = false) {
    const params = new URLSearchParams(this.queryParams());

    if (showEntireMonth) {
      const { year, month } = this.todayInBeirut();
      let requestYear = year;
      let requestMonth = month;
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        [requestYear, requestMonth] = date.split('-');
      }
      const url = `${this.apiBase}/calendarByCity/${requestYear}/${Number(requestMonth)}?${params}`;
      const payload = await this.fetchJson(url);
      if (payload.code !== 200 || !Array.isArray(payload.data)) {
        throw new Error(payload.status || 'Failed to fetch monthly prayer times');
      }

      return {
        success: true,
        lastUpdated: new Date().toISOString(),
        results: payload.data.map((day) => ({
          date: day.date?.gregorian?.date,
          hijri: day.date?.hijri,
          timings: this.mapTimings(day.timings || {}),
        })),
        location: {
          country: this.country,
          city: this.city,
          latitude: this.latitude,
          longitude: this.longitude,
          timezone: this.timezone,
        },
        settings: {
          method: this.method,
          school: this.school,
          source: 'aladhan',
        },
      };
    }

    const datePath = this.toAladhanDate(date);
    const url = `${this.apiBase}/timingsByCity/${datePath}?${params}`;
    const payload = await this.fetchJson(url);

    if (payload.code !== 200 || !payload.data?.timings) {
      throw new Error(payload.status || 'Failed to fetch prayer times');
    }

    return {
      success: true,
      lastUpdated: new Date().toISOString(),
      date: payload.data.date?.gregorian?.date || datePath,
      hijri: payload.data.date?.hijri || null,
      results: this.mapTimings(payload.data.timings),
      location: {
        country: this.country,
        city: this.city,
        latitude: this.latitude,
        longitude: this.longitude,
        timezone: this.timezone,
      },
      settings: {
        method: this.method,
        school: this.school,
        source: 'aladhan',
      },
    };
  }

  async savePrayerData(data) {
    await fs.promises.writeFile(this.dataFile, JSON.stringify(data, null, 2));
  }

  async loadPrayerData() {
    try {
      if (!fs.existsSync(this.dataFile)) {
        return null;
      }
      return JSON.parse(await fs.promises.readFile(this.dataFile, 'utf8'));
    } catch (error) {
      console.error('Failed to load prayer data:', error.message);
      return null;
    }
  }

  static isDataStale(lastUpdated) {
    if (!lastUpdated) return true;
    const hoursDiff = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 12;
  }

  isSameBeirutDay(data) {
    if (!data?.date) return false;
    const today = this.todayInBeirut();
    return data.date === today.path || data.date === `${today.day}-${today.month}-${today.year}`;
  }

  async updatePrayerData(date = null, showEntireMonth = false) {
    const prayerData = await this.fetchPrayerTimes(date, showEntireMonth);
    if (!showEntireMonth) {
      await this.savePrayerData(prayerData);
    }
    return prayerData;
  }

  async getCurrentPrayerTimes(date = null, forceUpdate = false) {
    try {
      if (!forceUpdate) {
        const existingData = await this.loadPrayerData();
        if (
          existingData?.results?.Fajr &&
          !PrayerService.isDataStale(existingData.lastUpdated) &&
          this.isSameBeirutDay(existingData)
        ) {
          return existingData;
        }
      }
      return await this.updatePrayerData(date);
    } catch (error) {
      console.error('Failed to get current prayer times:', error.message);
      const cachedData = await this.loadPrayerData();
      if (cachedData?.results?.Fajr) {
        return cachedData;
      }
      return {
        success: true,
        lastUpdated: new Date().toISOString(),
        results: {},
        location: {
          country: this.country,
          city: this.city,
          latitude: this.latitude,
          longitude: this.longitude,
          timezone: this.timezone,
        },
      };
    }
  }

  async getMonthlyPrayerTimes(date = null) {
    return this.fetchPrayerTimes(date, true);
  }
}

module.exports = PrayerService;
