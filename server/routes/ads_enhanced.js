const express = require('express');

const path = require('path');
const db = require('../config/database');

const router = express.Router();

// GET /api/ads - Get active ads by position
router.get('/', async (req, res) => {
  try {
    const { position, active_only = 'true' } = req.query;
    
    let query = `
      SELECT 
        a.id, a.title, a.description, a.image_path, a.url, a.position,
        a.width, a.height, a.is_active, a.start_date, a.end_date,
        a.clicks, a.impressions, a.created_at, a.updated_at,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by position if specified
    if (position) {
      query += ' AND a.position = ?';
      params.push(position);
    }
    
    // Filter active ads only
    if (active_only === 'true') {
      query += ' AND a.is_active = true';
      query += ' AND (a.start_date IS NULL OR a.start_date <= NOW())';
      query += ' AND (a.end_date IS NULL OR a.end_date >= NOW())';
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const [ads] = await db.query(query, params);
    
    // Process image paths to be absolute URLs
    const processedAds = ads.map(ad => {
      let imagePath = null;
      if (ad.image_path) {
        imagePath = ad.image_path.startsWith('http') ? ad.image_path : `/uploads/ads/${path.basename(ad.image_path)}`;
      }
      return {
        ...ad,
        image_path: imagePath,
        is_active: Boolean(ad.is_active)
      };
    });
    
    res.json({
      success: true,
      data: processedAds,
      count: processedAds.length
    });
    
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads',
      error: error.message
    });
  }
});

// GET /api/ads/positions - Get all ad positions
router.get('/positions', async (req, res) => {
  try {
    const [positions] = await db.query(`
      SELECT position_name, display_name, width, height, max_ads, description
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
      message: 'Failed to fetch ad positions',
      error: error.message
    });
  }
});

// POST /api/ads/:id/impression - Track ad impression
router.post('/:id/impression', async (req, res) => {
  try {
    const adId = parseInt(req.params.id, 10);
    const { ip_address, user_agent } = req.body;
    
    if (!adId || Number.isNaN(adId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid ad ID is required'
      });
    }
    
    // Check if ad exists and is active
    const [ad] = await db.query(
      'SELECT id FROM ads WHERE id = ? AND is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())',
      [adId]
    );
    
    if (ad.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or not active'
      });
    }
    
    // Get client IP and user agent
    const clientIP = ip_address || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const clientUserAgent = user_agent || req.headers['user-agent'] || 'unknown';
    
    // Check for duplicate impression (same IP within last hour)
    const [recentImpression] = await db.query(
      'SELECT id FROM ads_impressions WHERE ad_id = ? AND ip_address = ? AND viewed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
      [adId, clientIP]
    );
    
    if (recentImpression.length === 0) {
      // Record impression
      await db.query(
        'INSERT INTO ads_impressions (ad_id, ip_address, user_agent) VALUES (?, ?, ?)',
        [adId, clientIP, clientUserAgent]
      );
      
      // Update impression count
      await db.query(
        'UPDATE ads SET impressions = impressions + 1 WHERE id = ?',
        [adId]
      );
    }
    
    res.json({
      success: true,
      message: 'Impression tracked successfully'
    });
    
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track impression',
      error: error.message
    });
  }
});

// POST /api/ads/:id/click - Track ad click
router.post('/:id/click', async (req, res) => {
  try {
    const adId = parseInt(req.params.id, 10);
    const { ip_address, user_agent, referrer } = req.body;
    
    if (!adId || Number.isNaN(adId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid ad ID is required'
      });
    }
    
    // Get ad details
    const [ad] = await db.query(
      'SELECT id, url FROM ads WHERE id = ? AND is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())',
      [adId]
    );
    
    if (ad.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or not active'
      });
    }
    
    // Get client information
    const clientIP = ip_address || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const clientUserAgent = user_agent || req.headers['user-agent'] || 'unknown';
    const clientReferrer = referrer || req.headers.referer || 'unknown';
    
    // Record click
    await db.query(
      'INSERT INTO ads_clicks (ad_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)',
      [adId, clientIP, clientUserAgent, clientReferrer]
    );
    
    // Update click count
    await db.query(
      'UPDATE ads SET clicks = clicks + 1 WHERE id = ?',
      [adId]
    );
    
    res.json({
      success: true,
      message: 'Click tracked successfully',
      redirect_url: ad[0].url
    });
    
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error.message
    });
  }
});

// GET /api/ads/:id - Get specific ad
router.get('/:id', async (req, res) => {
  try {
    const adId = parseInt(req.params.id, 10);
    
    if (!adId || Number.isNaN(adId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid ad ID is required'
      });
    }
    
    const [ad] = await db.query(`
      SELECT 
        a.id, a.title, a.description, a.image_path, a.url, a.position,
        a.width, a.height, a.is_active, a.start_date, a.end_date,
        a.clicks, a.impressions, a.created_at, a.updated_at,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE a.id = ?
    `, [adId]);
    
    if (ad.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    let imagePath = null;
    if (ad[0].image_path) {
      imagePath = ad[0].image_path.startsWith('http') ? ad[0].image_path : `/uploads/ads/${path.basename(ad[0].image_path)}`;
    }
    
    const processedAd = {
      ...ad[0],
      image_path: imagePath,
      is_active: Boolean(ad[0].is_active)
    };
    
    res.json({
      success: true,
      data: processedAd
    });
    
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad',
      error: error.message
    });
  }
});

module.exports = router;