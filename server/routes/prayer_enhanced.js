const express = require('express');
const PrayerService = require('../utils/prayerService');
const { auth } = require('../middlewares/auth');

const router = express.Router();
const prayerService = new PrayerService();

/**
 * @route GET /api/prayer
 * @desc Get current prayer times for Lebanon
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { date, force_update } = req.query;
    const forceUpdate = force_update === 'true';
    
    const prayerData = await prayerService.getCurrentPrayerTimes(date, forceUpdate);
    
    res.json({
      success: true,
      data: prayerData,
      message: 'Prayer times retrieved successfully'
    });
  } catch (error) {
    console.error('Prayer API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prayer times',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/prayer/current
 * @desc Get current prayer times for Lebanon (alias for today)
 * @access Public
 */
router.get('/current', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const prayerData = await prayerService.getCurrentPrayerTimes(today);
    
    res.json({
      success: true,
      data: prayerData,
      message: 'Current prayer times retrieved successfully'
    });
  } catch (error) {
    console.error('Prayer Current API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve current prayer times',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/prayer/today
 * @desc Get today's prayer times for Lebanon
 * @access Public
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const prayerData = await prayerService.getCurrentPrayerTimes(today);
    
    res.json({
      success: true,
      data: prayerData,
      message: 'Today\'s prayer times retrieved successfully'
    });
  } catch (error) {
    console.error('Prayer Today API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve today\'s prayer times',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/prayer/monthly
 * @desc Get monthly prayer times for Lebanon
 * @access Public
 */
router.get('/monthly', async (req, res) => {
  try {
    const { date } = req.query;
    const prayerData = await prayerService.getMonthlyPrayerTimes(date);
    
    res.json({
      success: true,
      data: prayerData,
      message: 'Monthly prayer times retrieved successfully'
    });
  } catch (error) {
    console.error('Prayer Monthly API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly prayer times',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route POST /api/prayer/update
 * @desc Manually update prayer times (Admin only)
 * @access Private (Admin)
 */
router.post('/update', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { date, show_entire_month } = req.body;
    const showEntireMonth = show_entire_month === true || show_entire_month === 'true';
    
    const prayerData = await prayerService.updatePrayerData(date, showEntireMonth);
    
    res.json({
      success: true,
      data: prayerData,
      message: 'Prayer times updated successfully'
    });
  } catch (error) {
    console.error('Prayer Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prayer times',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/prayer/status
 * @desc Get prayer service status and last update time
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const prayerData = await prayerService.loadPrayerData();
    
    if (!prayerData) {
      return res.json({
        success: true,
        data: {
          status: 'no_data',
          lastUpdated: null,
          isStale: true,
          message: 'No prayer times data available'
        }
      });
    }

    const isStale = PrayerService.isDataStale(prayerData.lastUpdated);
    
    res.json({
      success: true,
      data: {
        status: isStale ? 'stale' : 'fresh',
        lastUpdated: prayerData.lastUpdated,
        isStale,
        location: prayerData.location,
        settings: prayerData.settings,
        message: isStale ? 'Prayer times data is stale' : 'Prayer times data is up to date'
      }
    });
  } catch (error) {
    console.error('Prayer Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prayer times status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/prayer/next
 * @desc Get next prayer time
 * @access Public
 */
router.get('/next', async (req, res) => {
  try {
    const prayerData = await prayerService.getCurrentPrayerTimes();
    
    if (!prayerData || !prayerData.results) {
      return res.status(404).json({
        success: false,
        message: 'No prayer times data available'
      });
    }

    // Find next prayer
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Fajr', time: prayerData.results.Fajr },
      { name: 'Duha', time: prayerData.results.Duha },
      { name: 'Dhuhr', time: prayerData.results.Dhuhr },
      { name: 'Asr', time: prayerData.results.Asr },
      { name: 'Maghrib', time: prayerData.results.Maghrib },
      { name: 'Isha', time: prayerData.results.Isha }
    ].filter(prayer => prayer.time && prayer.time.trim() !== '');
    
    if (!prayers || prayers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid prayer times found'
      });
    }

    let nextPrayer = prayers.find(prayer => {
      try {
        // Handle %am% and %pm% markers properly
        const cleanTime = prayer.time.replace(/%am%|%pm%/g, '').trim();
        const [hours, minutes] = cleanTime.split(':').map(Number);
        
        // Convert to 24-hour format if needed
        let adjustedHours = hours;
        if (prayer.time.includes('%pm%') && hours !== 12) {
          adjustedHours = hours + 12;
        } else if (prayer.time.includes('%am%') && hours === 12) {
          adjustedHours = 0;
        }
        
        const prayerTime = adjustedHours * 60 + minutes;
        return prayerTime > currentTime;
      } catch (err) {
        console.error('Error parsing prayer time:', prayer, err);
        return false;
      }
    });

    // If no prayer found for today, next prayer is Fajr tomorrow
    if (!nextPrayer) {
      nextPrayer = {
        name: 'Fajr',
        time: prayers[0].time,
        tomorrow: true
      };
    }
    
    res.json({
      success: true,
      data: {
        nextPrayer,
        allPrayers: prayers,
        date: new Date().toISOString().split('T')[0],
        location: prayerData.location
      },
      message: 'Next prayer time retrieved successfully'
    });
  } catch (error) {
    console.error('Next Prayer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next prayer time',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;