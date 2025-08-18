const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get active ad by position name
router.get('/position/:positionName', async (req, res) => {
  try {
    const { positionName } = req.params;
    
    const [ads] = await db.execute(`
      SELECT 
        a.id, a.title, a.image_path, a.link_url,
        ap.name as position_name, ap.name_ar as position_name_ar,
        ap.width, ap.height
      FROM ads a
      INNER JOIN ad_positions ap ON a.position_id = ap.id
      WHERE ap.name = ? 
        AND a.is_active = 1 
        AND a.start_date <= NOW() 
        AND a.expire_date > NOW()
      ORDER BY a.created_at DESC
      LIMIT 1
    `, [positionName]);
    
    if (ads.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'لا يوجد إعلان نشط في هذا الموقع'
      });
    }
    
    return res.json({
      success: true,
      data: ads[0]
    });
  } catch (error) {
    console.error('Error fetching ad by position:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Get all active ads (for homepage or general display)
router.get('/active', async (req, res) => {
  try {
    const [ads] = await db.execute(`
      SELECT 
        a.id, a.title, a.image_path, a.link_url,
        ap.name as position_name, ap.name_ar as position_name_ar,
        ap.width, ap.height
      FROM ads a
      INNER JOIN ad_positions ap ON a.position_id = ap.id
      WHERE a.is_active = 1 
        AND a.start_date <= NOW() 
        AND a.expire_date > NOW()
      ORDER BY ap.name, a.created_at DESC
    `);
    
    // Group ads by position
    const adsByPosition = {};
    ads.forEach(ad => {
      if (!adsByPosition[ad.position_name]) {
        adsByPosition[ad.position_name] = ad;
      }
    });
    
    return res.json({
      success: true,
      data: adsByPosition
    });
  } catch (error) {
    console.error('Error fetching active ads:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Track ad click (public endpoint) - Allow both GET and POST
router.all('/:id/click', async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const { id } = req.params.id;
    console.log('Tracking click for ad id:', id);
    
    // Get ad info first
    const [ads] = await db.execute(
      'SELECT id, clicks, expire_date FROM ads WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود أو غير نشط'
      });
    }
    
    const ad = ads[0];
    console.log('Found ad:', ad);
    
    // Check if ad is still active
    if (new Date(ad.expire_date) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'الإعلان منتهي الصلاحية'
      });
    }
    
    // Update click count
    console.log('Updating click count for ad id:', id);
    const [result] = await db.execute(
      'UPDATE ads SET clicks = clicks + 1 WHERE id = ?',
      [id]
    );
    console.log('DB update result:', result);
    
    return res.json({
      success: true,
      message: 'تم تسجيل النقرة بنجاح'
    });
  } catch (error) {
    console.error('Error tracking ad click:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'خطأ في تسجيل النقرة',
        error: error.message
      });
    }
  }
});

// Get ad positions (public - for frontend reference)
router.get('/positions', async (req, res) => {
  try {
    const [positions] = await db.execute(
      'SELECT name, name_ar, width, height FROM ad_positions WHERE is_active = 1 ORDER BY name'
    );
    
    return res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching ad positions:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

module.exports = router;