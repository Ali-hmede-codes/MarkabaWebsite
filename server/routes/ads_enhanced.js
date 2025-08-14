const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { query, queryOne, transaction } = require('../config/database');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads/ads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()  }-${  Math.round(Math.random() * 1E9)}`;
    cb(null, `ad-${  uniqueSuffix  }${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } 
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    
  }
});

// Helper function to delete expired ads
const deleteExpiredAds = async () => {
  try {
    // Get expired ads
    const expiredAds = await query(
      'SELECT id, image_path FROM ads WHERE end_date < NOW() AND is_active = true'
    );
    
    if (expiredAds[0].length > 0) {
      // Delete image files using Promise.all to avoid await in loop
      const deletePromises = expiredAds[0].map(async (ad) => {
        try {
          const imagePath = path.join(__dirname, '../public', ad.image_path);
          await fs.unlink(imagePath);
          console.log(`Deleted expired ad image: ${ad.image_path}`);
          return { success: true, ad };
        } catch (error) {
          console.error(`Failed to delete image ${ad.image_path}:`, error.message);
          return { success: false, ad, error };
        }
      });
      
      await Promise.all(deletePromises);
      
      // Mark ads as inactive
      await query('UPDATE ads SET is_active = false WHERE end_date < NOW() AND is_active = true');
      console.log(`Marked ${expiredAds[0].length} ads as expired`);
    }
  } catch (error) {
    console.error('Error deleting expired ads:', error);
  }
};

// Run cleanup every hour
setInterval(deleteExpiredAds, 60 * 60 * 1000);

// GET /api/ads - Get all ads (public)
router.get('/', async (req, res) => {
  try {
    await deleteExpiredAds(); // Clean up expired ads
    
    const { position, active_only = 'true' } = req.query;
    
    let queryStr = `
      SELECT 
        a.*,
        ap.display_name as position_display_name,
        ap.width as position_width,
        ap.height as position_height
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE 1=1
    `;
    const params = [];
    
    if (active_only === 'true') {
      queryStr += ' AND a.is_active = true AND a.end_date > NOW()';
    }
    
    if (position) {
      queryStr += ' AND a.position = ?';
      params.push(position);
    }
    
    queryStr += ' ORDER BY a.created_at DESC';
    
    const ads = await query(queryStr, params);
    
    res.json({
      success: true,
      data: ads[0],
      message: 'Ads retrieved successfully'
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

// GET /api/ads/positions - Get available positions
router.get('/positions', async (req, res) => {
  try {
    const positions = await query('SELECT * FROM ads_positions ORDER BY id');
    
    res.json({
      success: true,
      data: positions[0],
      message: 'Ad positions retrieved successfully'
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

// GET /api/ads/:id - Get single ad
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ad = await queryOne(
      `SELECT 
        a.*,
        ap.display_name as position_display_name,
        ap.width as position_width,
        ap.height as position_height
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE a.id = ?`,
      [id]
    );
    
    if (!ad[0]) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    res.json({
      success: true,
      data: ad[0],
      message: 'Ad retrieved successfully'
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

// POST /api/ads - Create new ad (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, url, position, end_date } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!title || !url || !position || !end_date || !req.file) {
      // Delete uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, url, position, end_date, and image'
      });
    }
    
    // Validate position exists
    const positionData = await queryOne(
      'SELECT * FROM ads_positions WHERE position_name = ?',
      [position]
    );
    
    if (!positionData[0]) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'Invalid position'
      });
    }
    
    // Check if position has reached max ads limit
    const activeAdsCount = await queryOne(
      'SELECT COUNT(*) as count FROM ads WHERE position = ? AND is_active = true AND end_date > NOW()',
      [position]
    );
    
    if (activeAdsCount[0].count >= positionData[0].max_ads) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: `Position ${positionData[0].display_name} has reached maximum ads limit (${positionData[0].max_ads})`
      });
    }
    
    // Validate end_date is in the future
    const endDate = new Date(end_date);
    if (endDate <= new Date()) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'End date must be in the future'
      });
    }
    
    const imagePath = `/uploads/ads/${req.file.filename}`;
    
    const result = await query(
      `INSERT INTO ads (title, description, image_path, url, position, width, height, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        imagePath,
        url,
        position,
        positionData[0].width,
        positionData[0].height,
        end_date,
        userId
      ]
    );
    
    const newAd = await queryOne(
      `SELECT 
        a.*,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE a.id = ?`,
      [result[0].insertId]
    );
    
    res.status(201).json({
      success: true,
      data: newAd[0],
      message: 'Ad created successfully'
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    console.error('Error creating ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ad',
      error: error.message
    });
  }
});

// PUT /api/ads/:id - Update ad (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, url, position, end_date, is_active } = req.body;
    
    // Get existing ad
    const existingAd = await queryOne('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (!existingAd[0]) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    let imagePath = existingAd[0].image_path;
    let width = existingAd[0].width;
    let height = existingAd[0].height;
    
    // If new image uploaded, delete old one and use new one
    if (req.file) {
      try {
        const oldImagePath = path.join(__dirname, '../public', existingAd[0].image_path);
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.error('Failed to delete old image:', error.message);
      }
      imagePath = `/uploads/ads/${req.file.filename}`;
    }
    
    // If position changed, validate and update dimensions
    if (position && position !== existingAd[0].position) {
      const positionData = await queryOne(
        'SELECT * FROM ads_positions WHERE position_name = ?',
        [position]
      );
      
      if (!positionData[0]) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid position'
        });
      }
      
      // Check position limit (excluding current ad)
      const activeAdsCount = await queryOne(
        'SELECT COUNT(*) as count FROM ads WHERE position = ? AND is_active = true AND end_date > NOW() AND id != ?',
        [position, id]
      );
      
      if (activeAdsCount[0].count >= positionData[0].max_ads) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(400).json({
          success: false,
          message: `Position ${positionData[0].display_name} has reached maximum ads limit (${positionData[0].max_ads})`
        });
      }
      
      width = positionData[0].width;
      height = positionData[0].height;
    }
    
    // Validate end_date if provided
    if (end_date) {
      const endDate = new Date(end_date);
      if (endDate <= new Date()) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(400).json({
          success: false,
          message: 'End date must be in the future'
        });
      }
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (url !== undefined) {
      updates.push('url = ?');
      params.push(url);
    }
    if (position !== undefined) {
      updates.push('position = ?', 'width = ?', 'height = ?');
      params.push(position, width, height);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(end_date);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (req.file) {
      updates.push('image_path = ?');
      params.push(imagePath);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    params.push(id);
    
    await query(
      `UPDATE ads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
    
    const updatedAd = await queryOne(
      `SELECT 
        a.*,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE a.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      data: updatedAd[0],
      message: 'Ad updated successfully'
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    console.error('Error updating ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ad',
      error: error.message
    });
  }
});

// DELETE /api/ads/:id - Delete ad (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get ad to delete image file
    const ad = await queryOne('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    // Delete image file
    try {
      const imagePath = path.join(__dirname, '../public', ad.image_path);
      await fs.unlink(imagePath);
    } catch (error) {
      console.error('Failed to delete image file:', error.message);
    }
    
    // Delete ad from database (cascades to clicks and impressions)
    await query('DELETE FROM ads WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ad',
      error: error.message
    });
  }
});

// POST /api/ads/:id/click - Track ad click
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const referrer = req.get('Referrer');
    
    // Check if ad exists and is active
    const ad = await queryOne(
      'SELECT * FROM ads WHERE id = ? AND is_active = true AND end_date > NOW()',
      [id]
    );
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or expired'
      });
    }
    
    // Record click
    await transaction(async (connection) => {
      // Insert click record
      await connection.execute(
        'INSERT INTO ads_clicks (ad_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)',
        [id, ip, userAgent, referrer]
      );
      
      // Update click count
      await connection.execute(
        'UPDATE ads SET clicks = clicks + 1 WHERE id = ?',
        [id]
      );
    });
    
    res.json({
      success: true,
      redirect_url: ad[0].url,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking ad click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error.message
    });
  }
});

// POST /api/ads/:id/impression - Track ad impression
router.post('/:id/impression', async (req, res) => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Check if ad exists and is active
    const ad = await queryOne(
      'SELECT id FROM ads WHERE id = ? AND is_active = true AND end_date > NOW()',
      [id]
    );
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or expired'
      });
    }
    
    // Record impression
    await transaction(async (connection) => {
      // Insert impression record
      await connection.execute(
        'INSERT INTO ads_impressions (ad_id, ip_address, user_agent) VALUES (?, ?, ?)',
        [id, ip, userAgent]
      );
      
      // Update impression count
      await connection.execute(
        'UPDATE ads SET impressions = impressions + 1 WHERE id = ?',
        [id]
      );
    });
    
    res.json({
      success: true,
      message: 'Impression tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking ad impression:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track impression',
      error: error.message
    });
  }
});

// GET /api/ads/:id/stats - Get ad statistics (admin only)
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    // Get ad basic info
    const ad = await queryOne('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    // Get click stats
    const clickStats = await query(
      `SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks
      FROM ads_clicks 
      WHERE ad_id = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC`,
      [id, days]
    );
    
    // Get impression stats
    const impressionStats = await query(
      `SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as impressions
      FROM ads_impressions 
      WHERE ad_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC`,
      [id, days]
    );
    
    // Calculate CTR
    const totalClicks = ad.clicks;
    const totalImpressions = ad.impressions;
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        ad: ad,
        stats: {
          total_clicks: totalClicks,
          total_impressions: totalImpressions,
          ctr: parseFloat(ctr),
          daily_clicks: clickStats,
          daily_impressions: impressionStats
        }
      },
      message: 'Ad statistics retrieved successfully'
    });
   } catch (error) {
    console.error('Error fetching ad stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad statistics',
      error: error.message
    });
  }
});

module.exports = router;