const express = require('express');
const { validationResult, param } = require('express-validator');
const path = require('path');
const { query, queryOne, pool } = require('../db');

const router = express.Router();

// GET /api/ads/positions - Get all available ad positions
router.get('/positions', async (req, res) => {
  try {
    const positions = await query(`
      SELECT 
        position_name,
        display_name,
        width,
        height,
        max_ads,
        description
      FROM ads_positions
      ORDER BY position_name
    `);
    
    res.json({
      success: true,
      data: positions
    });
    
  } catch (error) {
    console.error('Error fetching ad positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad positions',
      message: error.message
    });
  }
});

// GET /api/ads/position/:position - Get ads for a specific position
router.get('/position/:position', [
  param('position').custom(async (value) => {
    const positions = await query('SELECT position_name FROM ads_positions WHERE position_name = ?', [value]);
    if (positions.length === 0) {
      throw new Error('Invalid ad position');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { position } = req.params;
    const { limit = 1 } = req.query;
    
    // Validate and sanitize limit parameter
    const limitValue = Math.min(Math.max(parseInt(limit, 10) || 1, 1), 50);
    
    // Get active ads for the position
    const ads = await query(`
      SELECT 
        id,
        title,
        description,
        image_path,
        url,
        position,
        width,
        height,
        clicks,
        start_date,
        end_date
      FROM ads
      WHERE position = ? 
        AND is_active = 1 
        AND start_date <= NOW() 
        AND end_date > NOW()
      ORDER BY RAND()
      LIMIT ${limitValue}
    `, [position]);
    
    // Process ads to include full image URLs
    const processedAds = ads.map(ad => ({
      ...ad,
      image_url: ad.image_path ? `/uploads/ads/${path.basename(ad.image_path)}` : null,
      // Remove sensitive data
      image_path: undefined
    }));
    
    res.json({
      success: true,
      data: processedAds,
      position,
      count: processedAds.length
    });
    
  } catch (error) {
    console.error('Error fetching ads for position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ads',
      message: error.message
    });
  }
});

// GET /api/ads/active - Get all currently active ads
router.get('/active', async (req, res) => {
  try {
    const { position, limit = 10 } = req.query;
    
    // Validate and sanitize limit parameter
    const limitValue = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    
    let queryStr = `
      SELECT 
        id,
        title,
        description,
        image_path,
        url,
        position,
        width,
        height,
        clicks,
        start_date,
        end_date
      FROM ads
      WHERE is_active = 1 
        AND start_date <= NOW() 
        AND end_date > NOW()
    `;
    
    const params = [];
    
    if (position) {
      queryStr += ' AND position = ?';
      params.push(position);
    }
    
    // Use string interpolation for LIMIT to avoid parameter binding issues
    queryStr += ` ORDER BY position, RAND() LIMIT ${limitValue}`;
    
    const ads = await query(queryStr, params);
    
    // Process ads to include full image URLs
    const processedAds = ads.map(ad => ({
      ...ad,
      image_url: ad.image_path ? `/uploads/ads/${path.basename(ad.image_path)}` : null,
      // Remove sensitive data
      image_path: undefined
    }));
    
    // Group by position
    const groupedAds = {};
    processedAds.forEach(ad => {
      if (!groupedAds[ad.position]) {
        groupedAds[ad.position] = [];
      }
      groupedAds[ad.position].push(ad);
    });
    
    res.json({
      success: true,
      data: processedAds,
      grouped: groupedAds,
      count: processedAds.length
    });
    
  } catch (error) {
    console.error('Error fetching active ads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active ads',
      message: error.message
    });
  }
});

// POST /api/ads/:id/click - Track ad click
router.post('/:id/click', [
  param('id').isInt({ min: 1 }).withMessage('Invalid ad ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        errors: errors.array()
      });
    }
    
    const adId = parseInt(req.params.id, 10);
    const { referrer } = req.body;
    
    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    const userAgent = req.get('User-Agent') || '';
    
    // Verify ad exists and is active
    const ad = await queryOne(`
      SELECT id, url, clicks
      FROM ads 
      WHERE id = ? 
        AND is_active = 1 
        AND start_date <= NOW() 
        AND end_date > NOW()
    `, [adId]);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found or inactive'
      });
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert click record
      await connection.execute(`
        INSERT INTO ads_clicks (ad_id, ip_address, user_agent, referrer)
        VALUES (?, ?, ?, ?)
      `, [adId, ipAddress, userAgent, referrer || null]);
      
      // Update ad clicks count
      await connection.execute(`
        UPDATE ads 
        SET clicks = clicks + 1 
        WHERE id = ?
      `, [adId]);
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'Click tracked successfully',
        data: {
          ad_id: adId,
          redirect_url: ad.url,
          total_clicks: ad.clicks + 1
        }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error tracking ad click:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track click',
      message: error.message
    });
  }
});

// GET /api/ads/:id/stats - Get ad statistics (public, limited info)
router.get('/:id/stats', [
  param('id').isInt({ min: 1 }).withMessage('Invalid ad ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        errors: errors.array()
      });
    }
    
    const adId = parseInt(req.params.id, 10);
    
    // Verify ad exists and is active
    const ad = await queryOne(`
      SELECT id, title, clicks, start_date, end_date
      FROM ads 
      WHERE id = ? 
        AND is_active = 1 
        AND start_date <= NOW() 
        AND end_date > NOW()
    `, [adId]);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found or inactive'
      });
    }
    
    // Get basic click statistics
    const clickStats = await queryOne(`
      SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_clicks,
        COUNT(DISTINCT DATE(clicked_at)) as active_days
      FROM ads_clicks 
      WHERE ad_id = ?
    `, [adId]);
    
    res.json({
      success: true,
      data: {
        ad_id: adId,
        title: ad.title,
        total_clicks: ad.clicks,
        unique_clicks: clickStats.unique_clicks || 0,
        active_days: clickStats.active_days || 0,
        start_date: ad.start_date,
        end_date: ad.end_date,
        days_remaining: Math.ceil((new Date(ad.end_date) - new Date()) / (1000 * 60 * 60 * 24))
      }
    });
    
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad statistics',
      message: error.message
    });
  }
});

// GET /api/ads/server-time - Get current server time for frontend
router.get('/server-time', (req, res) => {
  try {
    const now = new Date();
    res.json({
      success: true,
      data: {
        current_time: now.toISOString(),
        local_time: now.toLocaleString('ar-EG', { timeZone: 'Asia/Beirut' }),
        timestamp: now.getTime(),
        timezone: 'Asia/Beirut'
      }
    });
  } catch (error) {
    console.error('Error getting server time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get server time',
      message: error.message
    });
  }
});

// GET /api/ads/health - Health check for ads system
router.get('/health', async (req, res) => {
  try {
    // Check if ads tables exist and are accessible
    const [adsCount] = await query('SELECT COUNT(*) as count FROM ads');
    const [positionsCount] = await query('SELECT COUNT(*) as count FROM ads_positions');
    const [clicksCount] = await query('SELECT COUNT(*) as count FROM ads_clicks');
    
    // Get active ads count
    const [activeAdsCount] = await query(`
      SELECT COUNT(*) as count 
      FROM ads 
      WHERE is_active = 1 
        AND start_date <= NOW() 
        AND end_date > NOW()
    `);
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        total_ads: adsCount[0].count,
        active_ads: activeAdsCount[0].count,
        positions: positionsCount[0].count,
        total_clicks: clicksCount[0].count,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Ads system health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Ads system health check failed',
      message: error.message
    });
  }
});

module.exports = router;