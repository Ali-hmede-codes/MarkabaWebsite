const express = require('express');
const WeatherService = require('../utils/weatherService.cjs');
const { auth } = require('../middlewares/auth.cjs');

const router = express.Router();
const weatherService = new WeatherService();

/**
 * @route GET /api/weather
 * @desc Get current weather data for Lebanon
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const weatherData = await weatherService.getCurrentWeather();
    
    res.json({
      success: true,
      data: weatherData,
      message: 'Weather data retrieved successfully'
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve weather data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route POST /api/weather/update
 * @desc Manually update weather data (Admin only)
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

    const weatherData = await weatherService.updateWeatherData();
    
    res.json({
      success: true,
      data: weatherData,
      message: 'Weather data updated successfully'
    });
  } catch (error) {
    console.error('Weather Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weather data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weather/status
 * @desc Get weather service status and last update time
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const weatherData = await weatherService.loadWeatherData();
    
    if (!weatherData) {
      return res.json({
        success: true,
        data: {
          status: 'no_data',
          lastUpdated: null,
          isStale: true,
          message: 'No weather data available'
        }
      });
    }

    const isStale = WeatherService.isDataStale(weatherData.lastUpdated);
    
    res.json({
      success: true,
      data: {
        status: isStale ? 'stale' : 'fresh',
        lastUpdated: weatherData.lastUpdated,
        isStale,
        location: weatherData.location,
        message: isStale ? 'Weather data is stale' : 'Weather data is up to date'
      }
    });
  } catch (error) {
    console.error('Weather Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weather/forecast
 * @desc Get weather forecast (if available in API response)
 * @access Public
 */
router.get('/forecast', async (req, res) => {
  try {
    const weatherData = await weatherService.getCurrentWeather();
    
    // Extract forecast data if available
    const forecast = weatherData.forecast || weatherData.daily || null;
    
    if (!forecast) {
      return res.json({
        success: true,
        data: null,
        message: 'No forecast data available'
      });
    }
    
    res.json({
      success: true,
      data: {
        forecast,
        lastUpdated: weatherData.lastUpdated,
        location: weatherData.location
      },
      message: 'Forecast data retrieved successfully'
    });
  } catch (error) {
    console.error('Weather Forecast Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve forecast data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;