const express = require('express');
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../../config/database');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth');
const adsService = require('../../utils/adsService');

const router = express.Router();

// Configure multer for ad image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/ads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()  }-${  Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `ad-${  uniqueSuffix  }${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } 
      cb(new Error('يُسمح فقط بملفات الصور (JPEG, JPG, PNG, GIF, WebP)'));
    
  }
});

// GET /admin/ads - Get all ads with pagination
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, position, status } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    // Validate parsed values
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }
    
    const offset = (pageNum - 1) * limitNum;
    
    let queryStr = `
      SELECT a.*, 
             ap.display_name as position_display_name,
             ap.width as position_width,
             ap.height as position_height
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE 1=1
    `;
    const params = [];
    
    if (position) {
      queryStr += ' AND a.position = ?';
      params.push(position);
    }
    
    if (status === 'active') {
      queryStr += ' AND a.is_active = true AND a.end_date > NOW()';
    } else if (status === 'expired') {
      queryStr += ' AND (a.is_active = false OR a.end_date <= NOW())';
    }
    
    // Get total count
    const countQuery = queryStr.replace(
      /SELECT\s+a\.\*,\s*ap\.display_name\s+as\s+position_display_name,\s*ap\.width\s+as\s+position_width,\s*ap\.height\s+as\s+position_height/i,
      'SELECT COUNT(*) as total'
    );
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult && countResult[0] ? countResult[0].total : 0;
    
    // Get paginated results
    queryStr += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
    
    const [ads] = await db.execute(queryStr, params);
    
    res.json({
      success: true,
      data: ads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      message: 'تم جلب الإعلانات بنجاح'
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الإعلانات',
      error: error.message
    });
  }
});

// GET /admin/ads/positions - Get available ad positions
router.get('/positions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [positions] = await db.execute('SELECT * FROM ads_positions ORDER BY id');
    
    res.json({
      success: true,
      data: positions,
      message: 'تم جلب مواضع الإعلانات بنجاح'
    });
  } catch (error) {
    console.error('Error fetching ad positions:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب مواضع الإعلانات',
      error: error.message
    });
  }
});

// GET /admin/ads/:id - Get single ad
router.get('/:id', 
  authenticateToken, 
  requireRole(['admin']),
  param('id').isInt().withMessage('معرف الإعلان يجب أن يكون رقماً'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      
      const [ad] = await db.execute(`
        SELECT 
          a.*,
          ap.display_name as position_display_name,
          ap.width as position_width,
          ap.height as position_height
        FROM ads a
        LEFT JOIN ads_positions ap ON a.position = ap.position_name
        WHERE a.id = ?
      `, [id]);
      
      if (ad.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: ad[0],
        message: 'تم جلب الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error fetching ad:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب الإعلان',
        error: error.message
      });
    }
  }
);

// POST /admin/ads - Create new ad
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  upload.single('image'),
  [
    body('title')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('عنوان الإعلان يجب أن يكون بين 3 و 200 حرف'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('وصف الإعلان يجب أن يكون أقل من 500 حرف'),
    body('url')
      .isURL()
      .withMessage('رابط الإعلان يجب أن يكون رابطاً صحيحاً'),
    body('position')
      .notEmpty()
      .withMessage('موضع الإعلان مطلوب'),
    body('end_date')
      .isISO8601()
      .withMessage('تاريخ انتهاء الإعلان يجب أن يكون تاريخاً صحيحاً')
      .custom((value) => {
        const endDate = new Date(value);
        if (endDate <= new Date()) {
          throw new Error('تاريخ انتهاء الإعلان يجب أن يكون في المستقبل');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Delete uploaded file if validation fails
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
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
      
      const { title, description, url, position, end_date } = req.body;
      
      // Validate position and check limits
      const validation = await adsService.validateAdPosition(position);
      if (!validation.valid) {
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
      
      const imagePath = `/uploads/ads/${req.file.filename}`;
      
      // Insert new ad
      const [result] = await db.execute(
        `INSERT INTO ads (title, description, image_path, url, position, width, height, end_date, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [title, description || null, imagePath, url, position, validation.position.width, validation.position.height, end_date]
      );
      
      // Get the created ad
      const [newAd] = await db.execute(`
        SELECT 
          a.*,
          ap.display_name as position_display_name
        FROM ads a
        LEFT JOIN ads_positions ap ON a.position = ap.position_name
        WHERE a.id = ?
      `, [result.insertId]);
      
      res.status(201).json({
        success: true,
        data: newAd[0],
        message: 'تم إنشاء الإعلان بنجاح'
      });
    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      console.error('Error creating ad:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إنشاء الإعلان',
        error: error.message
      });
    }
  }
);

// PUT /admin/ads/:id - Update ad
router.put('/:id',
  authenticateToken,
  requireRole(['admin']),
  upload.single('image'),
  [
    param('id').isInt().withMessage('معرف الإعلان يجب أن يكون رقماً'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('عنوان الإعلان يجب أن يكون بين 3 و 200 حرف'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('وصف الإعلان يجب أن يكون أقل من 500 حرف'),
    body('url')
      .optional()
      .isURL()
      .withMessage('رابط الإعلان يجب أن يكون رابطاً صحيحاً'),
    body('position')
      .optional()
      .notEmpty()
      .withMessage('موضع الإعلان لا يمكن أن يكون فارغاً'),
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('تاريخ انتهاء الإعلان يجب أن يكون تاريخاً صحيحاً')
      .custom((value) => {
        const endDate = new Date(value);
        if (endDate <= new Date()) {
          throw new Error('تاريخ انتهاء الإعلان يجب أن يكون في المستقبل');
        }
        return true;
      }),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('حالة الإعلان يجب أن تكون true أو false')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const { title, description, url, position, end_date, is_active } = req.body;
      
      // Check if ad exists
      const [existingAd] = await db.execute('SELECT * FROM ads WHERE id = ?', [id]);
      if (existingAd.length === 0) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      let imagePath = existingAd[0].image_path;
      let width = existingAd[0].width;
      let height = existingAd[0].height;
      
      // Handle position change
      if (position && position !== existingAd[0].position) {
        const validation = await adsService.validateAdPosition(position, id);
        if (!validation.valid) {
          if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
          }
          return res.status(400).json({
            success: false,
            message: validation.message
          });
        }
        width = validation.position.width;
        height = validation.position.height;
      }
      
      // Handle image update
      if (req.file) {
        // Delete old image
        const oldImagePath = path.join(__dirname, '../../public', existingAd[0].image_path);
        await fs.unlink(oldImagePath).catch(console.error);
        
        imagePath = `/uploads/ads/${req.file.filename}`;
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
          message: 'لا توجد حقول للتحديث'
        });
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      
      await db.execute(
        `UPDATE ads SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      // Get updated ad
      const [updatedAd] = await db.execute(`
        SELECT 
          a.*,
          ap.display_name as position_display_name
        FROM ads a
        LEFT JOIN ads_positions ap ON a.position = ap.position_name
        WHERE a.id = ?
      `, [id]);
      
      res.json({
        success: true,
        data: updatedAd[0],
        message: 'تم تحديث الإعلان بنجاح'
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      console.error('Error updating ad:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في تحديث الإعلان',
        error: error.message
      });
    }
  }
);

// DELETE /admin/ads/:id - Delete ad
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  param('id').isInt().withMessage('معرف الإعلان يجب أن يكون رقماً'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      
      // Get ad info before deletion
      const [ad] = await db.execute('SELECT * FROM ads WHERE id = ?', [id]);
      if (ad.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // Delete ad from database
      await db.execute('DELETE FROM ads WHERE id = ?', [id]);
      
      // Delete image file
      const imagePath = path.join(__dirname, '../../public', ad[0].image_path);
      await fs.unlink(imagePath).catch(console.error);
      
      res.json({
        success: true,
        message: 'تم حذف الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في حذف الإعلان',
        error: error.message
      });
    }
  }
);

// GET /admin/ads/:id/stats - Get ad statistics
router.get('/:id/stats', 
  authenticateToken, 
  requireRole(['admin']),
  param('id').isInt().withMessage('معرف الإعلان يجب أن يكون رقماً'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const { days = 30 } = req.query;
      
      // Get ad basic info
      const [ad] = await db.execute('SELECT * FROM ads WHERE id = ?', [id]);
      if (ad.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // Get click statistics
      const [clickStats] = await db.execute(`
        SELECT 
          DATE(clicked_at) as date,
          COUNT(*) as clicks
        FROM ads_clicks 
        WHERE ad_id = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(clicked_at)
        ORDER BY date DESC
      `, [id, days]);
      
      // Get impression statistics
      const [impressionStats] = await db.execute(`
        SELECT 
          DATE(viewed_at) as date,
          COUNT(*) as impressions
        FROM ads_impressions 
        WHERE ad_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(viewed_at)
        ORDER BY date DESC
      `, [id, days]);
      
      // Get total stats
      const [totalStats] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM ads_clicks WHERE ad_id = ?) as total_clicks,
          (SELECT COUNT(*) FROM ads_impressions WHERE ad_id = ?) as total_impressions
      `, [id, id]);
      
      // Calculate CTR (Click Through Rate)
      const ctr = totalStats[0].total_impressions > 0 
        ? (totalStats[0].total_clicks / totalStats[0].total_impressions * 100).toFixed(2)
        : 0;
      
      res.json({
        success: true,
        data: {
          ad: ad[0],
          stats: {
            total_clicks: totalStats[0].total_clicks,
            total_impressions: totalStats[0].total_impressions,
            ctr: parseFloat(ctr),
            daily_clicks: clickStats,
            daily_impressions: impressionStats
          }
        },
        message: 'تم جلب إحصائيات الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error fetching ad stats:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب إحصائيات الإعلان',
        error: error.message
      });
    }
  }
);

// GET /admin/ads/stats/overview - Get ads overview statistics
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const summary = await adsService.getAdsSummary();
    
    res.json({
      success: true,
      data: summary,
      message: 'تم جلب ملخص الإعلانات بنجاح'
    });
  } catch (error) {
    console.error('Error fetching ads overview:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب ملخص الإعلانات',
      error: error.message
    });
  }
});

// POST /admin/ads/cleanup - Manual cleanup of expired ads
router.post('/cleanup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await adsService.cleanupExpiredAds();
    
    res.json({
      success: true,
      data: result,
      message: 'تم تنظيف الإعلانات المنتهية الصلاحية بنجاح'
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تنظيف الإعلانات',
      error: error.message
    });
  }
});

module.exports = router;