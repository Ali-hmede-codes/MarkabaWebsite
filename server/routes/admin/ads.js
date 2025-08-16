const express = require('express');
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../../config/database');


const router = express.Router();

// Configure multer for ad image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads/ads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
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
      cb(new Error('Only image files are allowed'));
    
  }
});

// Apply authentication middleware to all routes - TEMPORARILY DISABLED FOR TESTING
// router.use(authenticateToken);
// router.use(requireRole(['admin', 'editor', 'author']));

// GET /api/admin/administratorpage/ads - Get all ads with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      position = '',
      is_active = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(a.title LIKE ? OR a.description LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (position) {
      whereConditions.push('a.position = ?');
      queryParams.push(position);
    }
    
    if (is_active !== '') {
      whereConditions.push('a.is_active = ?');
      queryParams.push(is_active === 'true' ? 1 : 0);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort parameters
    const allowedSortFields = ['id', 'title', 'position', 'clicks', 'is_active', 'start_date', 'end_date', 'created_at'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;
    
    // Get ads with creator info
    const adsQuery = `
      SELECT 
        a.*,
        u.username as created_by_username,
        u.display_name as created_by_name,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      ${whereClause}
      ORDER BY a.${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit, 10), offset);
    const [ads] = await db.execute(adsQuery, queryParams);
    
    // Process ads data
    const processedAds = ads.map(ad => ({
      ...ad,
      is_active: Boolean(ad.is_active),
      image_url: ad.image_path ? `/uploads/ads/${path.basename(ad.image_path)}` : null,
      is_expired: new Date(ad.end_date) < new Date(),
      days_remaining: Math.ceil((new Date(ad.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));
    
    res.json({
      success: true,
      data: processedAds,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      },
      filters: {
        search,
        position,
        is_active,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder
      }
    });
    
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإعلانات'
    });
  }
});

// GET /api/admin/administratorpage/ads/server-time - Get current server time
router.get('/server-time', async (req, res) => {
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
      message: 'خطأ في جلب وقت الخادم'
    });
  }
});

// GET /api/admin/administratorpage/ads/positions - Get all ad positions
router.get('/positions', async (req, res) => {
  try {
    const [positions] = await db.execute(`
      SELECT 
        ap.*,
        COUNT(a.id) as active_ads_count
      FROM ads_positions ap
      LEFT JOIN ads a ON ap.position_name = a.position AND a.is_active = 1 AND a.end_date > NOW()
      GROUP BY ap.id
      ORDER BY ap.position_name
    `);
    
    res.json({
      success: true,
      data: positions
    });
    
  } catch (error) {
    console.error('Error fetching ad positions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب مواضع الإعلانات'
    });
  }
});

// GET /api/admin/administratorpage/ads/:id - Get single ad
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('معرف الإعلان غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }
    
    const adId = parseInt(req.params.id, 10);
    
    const [ads] = await db.execute(`
      SELECT 
        a.*,
        u.username as created_by_username,
        u.display_name as created_by_name,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE a.id = ?
    `, [adId]);
    
    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }
    
    const ad = ads[0];
    
    // Get click statistics
    const [clickStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_clicks,
        DATE(clicked_at) as click_date,
        COUNT(*) as daily_clicks
      FROM ads_clicks 
      WHERE ad_id = ?
      GROUP BY DATE(clicked_at)
      ORDER BY click_date DESC
      LIMIT 30
    `, [adId]);
    
    res.json({
      success: true,
      data: {
        ...ad,
        is_active: Boolean(ad.is_active),
        image_url: ad.image_path ? `/uploads/ads/${path.basename(ad.image_path)}` : null,
        is_expired: new Date(ad.end_date) < new Date(),
        days_remaining: Math.ceil((new Date(ad.end_date) - new Date()) / (1000 * 60 * 60 * 24)),
        click_statistics: clickStats
      }
    });
    
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإعلان'
    });
  }
});

// POST /api/admin/administratorpage/ads - Create new ad
router.post('/', upload.single('image'), [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('عنوان الإعلان مطلوب ولا يجب أن يتجاوز 255 حرف'),
  body('description').optional().isLength({ max: 1000 }).withMessage('وصف الإعلان لا يجب أن يتجاوز 1000 حرف'),
  body('url').isURL().withMessage('رابط الإعلان غير صحيح'),
  body('position').custom(async (value) => {
    const [positions] = await db.execute('SELECT position_name FROM ads_positions WHERE position_name = ?', [value]);
    if (positions.length === 0) {
      throw new Error('موضع الإعلان غير صحيح');
    }
    return true;
  }),
  body('width').isInt({ min: 1, max: 2000 }).withMessage('عرض الإعلان يجب أن يكون رقم صحيح بين 1 و 2000'),
  body('height').isInt({ min: 1, max: 2000 }).withMessage('ارتفاع الإعلان يجب أن يكون رقم صحيح بين 1 و 2000'),
  body('end_date').isISO8601().withMessage('تاريخ انتهاء الإعلان غير صحيح'),
  body('is_active').optional().isBoolean().withMessage('حالة الإعلان يجب أن تكون true أو false')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'صورة الإعلان مطلوبة'
      });
    }
    
    const {
      title,
      description,
      url,
      position,
      width,
      height,
      end_date,
      is_active = true
    } = req.body;
    
    // Validate end_date is in the future
    if (new Date(end_date) <= new Date()) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'تاريخ انتهاء الإعلان يجب أن يكون في المستقبل'
      });
    }
    
    // Check position availability
    const [positionInfo] = await db.execute(
      'SELECT max_ads FROM ads_positions WHERE position_name = ?',
      [position]
    );
    
    if (positionInfo.length === 0) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'موضع الإعلان غير صحيح'
      });
    }
    
    const [activeAdsCount] = await db.execute(
      'SELECT COUNT(*) as count FROM ads WHERE position = ? AND is_active = 1 AND end_date > NOW()',
      [position]
    );
    
    if (activeAdsCount[0].count >= positionInfo[0].max_ads) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: `موضع الإعلان ممتلئ. الحد الأقصى: ${positionInfo[0].max_ads}`
      });
    }
    
    // Auto-set start_date to current Lebanon time (Asia/Beirut timezone)
    const lebanonTime = `${new Date().toLocaleString('en-CA', { 
      timeZone: 'Asia/Beirut',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(', ', 'T')}.000Z`;
    const start_date = lebanonTime;
    
    // Insert new ad
    const [result] = await db.execute(`
      INSERT INTO ads (
        title, description, image_path, url, position, width, height,
        is_active, start_date, end_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description ? description.trim() : null,
      req.file.path,
      url,
      position,
      parseInt(width, 10),
      parseInt(height, 10),
      is_active,
      start_date,
      end_date,
      req.user.id
    ]);
    
    // Get the created ad
    const [createdAd] = await db.execute(`
      SELECT 
        a.*,
        u.username as created_by_username,
        u.display_name as created_by_name,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE a.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الإعلان بنجاح',
      data: {
        ...createdAd[0],
        is_active: Boolean(createdAd[0].is_active),
        image_url: `/uploads/ads/${path.basename(req.file.path)}`
      }
    });
    
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Error creating ad:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الإعلان'
    });
  }
});

// PUT /api/admin/administratorpage/ads/:id - Update ad
router.put('/:id', upload.single('image'), [
  param('id').isInt({ min: 1 }).withMessage('معرف الإعلان غير صحيح'),
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('عنوان الإعلان مطلوب ولا يجب أن يتجاوز 255 حرف'),
  body('description').optional().isLength({ max: 1000 }).withMessage('وصف الإعلان لا يجب أن يتجاوز 1000 حرف'),
  body('url').isURL().withMessage('رابط الإعلان غير صحيح'),
  body('position').custom(async (value) => {
    const [positions] = await db.execute('SELECT position_name FROM ads_positions WHERE position_name = ?', [value]);
    if (positions.length === 0) {
      throw new Error('موضع الإعلان غير صحيح');
    }
    return true;
  }),
  body('width').isInt({ min: 1, max: 2000 }).withMessage('عرض الإعلان يجب أن يكون رقم صحيح بين 1 و 2000'),
  body('height').isInt({ min: 1, max: 2000 }).withMessage('ارتفاع الإعلان يجب أن يكون رقم صحيح بين 1 و 2000'),
  body('end_date').isISO8601().withMessage('تاريخ انتهاء الإعلان غير صحيح'),
  body('is_active').optional().isBoolean().withMessage('حالة الإعلان يجب أن تكون true أو false')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }
    
    const adId = parseInt(req.params.id, 10);
    
    // Check if ad exists
    const [existingAd] = await db.execute('SELECT * FROM ads WHERE id = ?', [adId]);
    if (existingAd.length === 0) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }
    
    const {
      title,
      description,
      url,
      position,
      width,
      height,
      end_date,
      is_active
    } = req.body;
    
    // Validate end_date is in the future
    if (new Date(end_date) <= new Date()) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'تاريخ انتهاء الإعلان يجب أن يكون في المستقبل'
      });
    }
    
    // Check position availability if position changed
    if (position !== existingAd[0].position) {
      const [positionInfo] = await db.execute(
        'SELECT max_ads FROM ads_positions WHERE position_name = ?',
        [position]
      );
      
      if (positionInfo.length === 0) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(400).json({
          success: false,
          message: 'موضع الإعلان غير صحيح'
        });
      }
      
      const [activeAdsCount] = await db.execute(
        'SELECT COUNT(*) as count FROM ads WHERE position = ? AND is_active = 1 AND end_date > NOW() AND id != ?',
        [position, adId]
      );
      
      if (activeAdsCount[0].count >= positionInfo[0].max_ads) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(400).json({
          success: false,
          message: `موضع الإعلان ممتلئ. الحد الأقصى: ${positionInfo[0].max_ads}`
        });
      }
    }
    
    // Prepare update data
    let updateQuery = `
      UPDATE ads SET 
        title = ?, description = ?, url = ?, position = ?, 
        width = ?, height = ?, end_date = ?, is_active = ?
    `;
    
    const updateParams = [
      title.trim(),
      description ? description.trim() : null,
      url,
      position,
      parseInt(width, 10),
      parseInt(height, 10),
      end_date,
      is_active !== undefined ? is_active : existingAd[0].is_active
    ];
    
    // Handle image update
    if (req.file) {
      updateQuery += ', image_path = ?';
      updateParams.push(req.file.path);
      
      // Delete old image
      if (existingAd[0].image_path) {
        await fs.unlink(existingAd[0].image_path).catch(() => {});
      }
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(adId);
    
    await db.execute(updateQuery, updateParams);
    
    // Get updated ad
    const [updatedAd] = await db.execute(`
      SELECT 
        a.*,
        u.username as created_by_username,
        u.display_name as created_by_name,
        ap.display_name as position_display_name
      FROM ads a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE a.id = ?
    `, [adId]);
    
    res.json({
      success: true,
      message: 'تم تحديث الإعلان بنجاح',
      data: {
        ...updatedAd[0],
        is_active: Boolean(updatedAd[0].is_active),
        image_url: updatedAd[0].image_path ? `/uploads/ads/${path.basename(updatedAd[0].image_path)}` : null
      }
    });
    
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Error updating ad:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإعلان'
    });
  }
});

// DELETE /api/admin/administratorpage/ads/:id - Delete ad
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('معرف الإعلان غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }
    
    const adId = parseInt(req.params.id, 10);
    
    // Get ad info before deletion
    const [ad] = await db.execute('SELECT * FROM ads WHERE id = ?', [adId]);
    if (ad.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }
    
    // Delete ad (this will cascade delete clicks due to foreign key)
    await db.execute('DELETE FROM ads WHERE id = ?', [adId]);
    
    // Delete image file
    if (ad[0].image_path) {
      await fs.unlink(ad[0].image_path).catch(() => {});
    }
    
    res.json({
      success: true,
      message: 'تم حذف الإعلان بنجاح'
    });
    
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الإعلان'
    });
  }
});

// POST /api/admin/administratorpage/ads/:id/toggle - Toggle ad active status
router.post('/:id/toggle', [
  param('id').isInt({ min: 1 }).withMessage('معرف الإعلان غير صحيح')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: errors.array()
      });
    }
    
    const adId = parseInt(req.params.id, 10);
    
    // Get current status
    const [ad] = await db.execute('SELECT is_active FROM ads WHERE id = ?', [adId]);
    if (ad.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }
    
    const newStatus = !ad[0].is_active;
    
    // Update status
    await db.execute('UPDATE ads SET is_active = ? WHERE id = ?', [newStatus, adId]);
    
    res.json({
      success: true,
      message: `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} الإعلان بنجاح`,
      data: {
        id: adId,
        is_active: newStatus
      }
    });
    
  } catch (error) {
    console.error('Error toggling ad status:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تغيير حالة الإعلان'
    });
  }
});

// GET /api/admin/administratorpage/ads/stats/overview - Get ads statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get basic stats
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_ads,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_ads,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_ads,
        SUM(CASE WHEN end_date < NOW() THEN 1 ELSE 0 END) as expired_ads,
        SUM(clicks) as total_clicks
      FROM ads
    `);
    
    // Get ads by position
    const [adsByPosition] = await db.execute(`
      SELECT 
        position,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = 1 AND end_date > NOW() THEN 1 ELSE 0 END) as active_count
      FROM ads
      GROUP BY position
      ORDER BY position
    `);
    
    // Get top performing ads
    const [topAds] = await db.execute(`
      SELECT 
        id, title, position, clicks, 
        CASE WHEN end_date < NOW() THEN 'expired' 
             WHEN is_active = 0 THEN 'inactive'
             ELSE 'active' END as status
      FROM ads
      ORDER BY clicks DESC
      LIMIT 5
    `);
    
    // Get recent clicks
    const [recentClicks] = await db.execute(`
      SELECT 
        DATE(ac.clicked_at) as click_date,
        COUNT(*) as clicks_count
      FROM ads_clicks ac
      WHERE ac.clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(ac.clicked_at)
      ORDER BY click_date DESC
      LIMIT 30
    `);
    
    res.json({
      success: true,
      data: {
        overview: stats[0],
        by_position: adsByPosition,
        top_performing: topAds,
        recent_clicks: recentClicks
      }
    });
    
  } catch (error) {
    console.error('Error fetching ads statistics:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الإعلانات'
    });
  }
});

module.exports = router;