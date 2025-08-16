const express = require('express');
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../../config/database');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth');

const router = express.Router();

// Configure multer for ad image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/ads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `ad-${uniqueSuffix}${ext}`);
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

// Validation middleware
const validateAdCreation = [
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
    .withMessage('موضع الإعلان مطلوب')
    .isIn(['main_top', 'main_middle', 'main_bottom', 'post_square', 'post_banner'])
    .withMessage('موضع الإعلان غير صحيح'),
  body('end_date')
    .notEmpty()
    .withMessage('تاريخ ووقت انتهاء الإعلان مطلوب')
    .isISO8601()
    .withMessage('تاريخ انتهاء الإعلان يجب أن يكون تاريخاً صحيحاً')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('تاريخ انتهاء الإعلان يجب أن يكون في المستقبل');
      }
      return true;
    })
];

const validateAdUpdate = [
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
    .isIn(['main_top', 'main_middle', 'main_bottom', 'post_square', 'post_banner'])
    .withMessage('موضع الإعلان غير صحيح'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('تاريخ انتهاء الإعلان يجب أن يكون تاريخاً صحيحاً')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('تاريخ انتهاء الإعلان يجب أن يكون في المستقبل');
      }
      return true;
    }),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('حالة الإعلان يجب أن تكون true أو false')
];

// Helper function to ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../../public/uploads/ads');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};

// Helper function to validate ad position limits
const validatePositionLimits = async (position, excludeAdId = null) => {
  try {
    // Get position info
    const [positionInfo] = await db.query(
      'SELECT * FROM ads_positions WHERE position_name = ?',
      [position]
    );
    
    if (positionInfo.length === 0) {
      return { valid: false, error: 'موضع الإعلان غير صحيح' };
    }
    
    // Count active ads in this position
    let countQuery = 'SELECT COUNT(*) as count FROM ads WHERE position = ? AND is_active = true AND end_date > NOW()';
    const countParams = [position];
    
    if (excludeAdId) {
      countQuery += ' AND id != ?';
      countParams.push(excludeAdId);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const currentCount = countResult[0].count;
    
    if (currentCount >= positionInfo[0].max_ads) {
      return {
        valid: false,
        error: `موضع ${positionInfo[0].display_name} وصل للحد الأقصى من الإعلانات (${positionInfo[0].max_ads})`
      };
    }
    
    return {
      valid: true,
      position: positionInfo[0],
      current_count: currentCount,
      available_slots: positionInfo[0].max_ads - currentCount
    };
  } catch (error) {
    console.error('Error validating position limits:', error);
    throw error;
  }
};

// GET /admin/ads - Get all ads with pagination and filtering
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, position, status } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Build query conditions
    const whereConditions = [];
    const queryParams = [];
    
    if (position) {
      whereConditions.push('a.position = ?');
      queryParams.push(position);
    }
    
    if (status === 'active') {
      whereConditions.push('a.is_active = true AND a.end_date > NOW()');
    } else if (status === 'expired') {
      whereConditions.push('a.end_date <= NOW()');
    } else if (status === 'inactive') {
      whereConditions.push('a.is_active = false');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      ${whereClause}
    `;
    
    const [countResult] = await db.query(countQuery, queryParams);
    const total = countResult && countResult[0] ? countResult[0].total : 0;
    
    // Get ads with pagination
    const adsQuery = `
      SELECT 
        a.*,
        ap.display_name as position_display_name,
        ap.width as position_width,
        ap.height as position_height,
        u.username as created_by_username,
        CASE 
          WHEN a.end_date <= NOW() THEN 'expired'
          WHEN a.is_active = false THEN 'inactive'
          ELSE 'active'
        END as status
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      LEFT JOIN users u ON a.created_by = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...queryParams, limitNum, offset];
    const [ads] = await db.query(adsQuery, finalParams);
    
    res.json({
      success: true,
      data: ads,
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total: total,
        total_pages: Math.ceil(total / limitNum),
        has_next: pageNum < Math.ceil(total / limitNum),
        has_prev: pageNum > 1
      },
      message: 'تم جلب الإعلانات بنجاح'
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
      error: error.message
    });
  }
});

// GET /admin/ads/positions - Get available ad positions
router.get('/positions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [positions] = await db.query(`
      SELECT 
        ap.*,
        COUNT(a.id) as current_ads,
        SUM(CASE WHEN a.is_active = true AND a.end_date > NOW() THEN 1 ELSE 0 END) as active_ads
      FROM ads_positions ap
      LEFT JOIN ads a ON ap.position_name = a.position
      GROUP BY ap.id, ap.position_name, ap.display_name, ap.width, ap.height, ap.max_ads, ap.description
      ORDER BY ap.id
    `);
    
    res.json({
      success: true,
      data: positions,
      message: 'تم جلب مواضع الإعلانات بنجاح'
    });
  } catch (error) {
    console.error('Error fetching ad positions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
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
      
      const [ads] = await db.query(`
        SELECT 
          a.*,
          ap.display_name as position_display_name,
          ap.width as position_width,
          ap.height as position_height,
          u.username as created_by_username,
          CASE 
            WHEN a.end_date <= NOW() THEN 'expired'
            WHEN a.is_active = false THEN 'inactive'
            ELSE 'active'
          END as status
        FROM ads a
        LEFT JOIN ads_positions ap ON a.position = ap.position_name
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.id = ?
      `, [id]);
      
      if (ads.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: ads[0],
        message: 'تم جلب الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error fetching ad:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي',
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
  validateAdCreation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting uploaded file:', unlinkError);
          }
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
      
      // Validate position limits
      const positionValidation = await validatePositionLimits(position);
      if (!positionValidation.valid) {
        // Clean up uploaded file
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
        return res.status(400).json({
          success: false,
          message: positionValidation.error
        });
      }
      
      // Ensure uploads directory exists
      await ensureUploadsDir();
      
      // Create image path relative to public directory
      const imagePath = `/uploads/ads/${req.file.filename}`;
      
      // Set start_date to current timestamp automatically
      const start_date = new Date().toISOString();
      
      // Insert ad into database
      const [result] = await db.query(`
        INSERT INTO ads (
          title, description, image_path, url, position, 
          width, height, start_date, end_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title,
        description || null,
        imagePath,
        url,
        position,
        positionValidation.position.width,
        positionValidation.position.height,
        start_date,
        end_date,
        req.user.id
      ]);
      
      // Get the created ad
      const [newAd] = await db.query(`
        SELECT 
          a.*,
          ap.display_name as position_display_name,
          u.username as created_by_username
        FROM ads a
        LEFT JOIN ads_positions ap ON a.position = ap.position_name
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.id = ?
      `, [result.insertId]);
      
      res.status(201).json({
        success: true,
        data: newAd[0],
        message: 'تم إنشاء الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error creating ad:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي',
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
  validateAdUpdate,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting uploaded file:', unlinkError);
          }
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
      const [existingAd] = await db.query('SELECT * FROM ads WHERE id = ?', [id]);
      if (existingAd.length === 0) {
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting uploaded file:', unlinkError);
          }
        }
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // Validate position limits if position is being changed
      if (position && position !== existingAd[0].position) {
        const positionValidation = await validatePositionLimits(position, id);
        if (!positionValidation.valid) {
          if (req.file) {
            try {
              await fs.unlink(req.file.path);
            } catch (unlinkError) {
              console.error('Error deleting uploaded file:', unlinkError);
            }
          }
          return res.status(400).json({
            success: false,
            message: positionValidation.error
          });
        }
      }
      
      // Build update query
      const updateFields = [];
      const finalParams = [];
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        finalParams.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        finalParams.push(description);
      }
      if (url !== undefined) {
        updateFields.push('url = ?');
        finalParams.push(url);
      }
      if (position !== undefined) {
        updateFields.push('position = ?', 'width = ?', 'height = ?');
        finalParams.push(position);
        
        // Get dimensions for the new position
        const [positionInfo] = await db.query(
          'SELECT width, height FROM ads_positions WHERE position_name = ?',
          [position]
        );
        if (positionInfo.length > 0) {
          finalParams.push(positionInfo[0].width, positionInfo[0].height);
        }
      }
      if (end_date !== undefined) {
        updateFields.push('end_date = ?');
        finalParams.push(end_date);
      }
      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        finalParams.push(is_active);
      }
      
      // Handle image update
      let oldImagePath = null;
      if (req.file) {
        oldImagePath = existingAd[0].image_path;
        updateFields.push('image_path = ?');
        finalParams.push(`/uploads/ads/${req.file.filename}`);
      }
      
      if (updateFields.length > 0) {
        finalParams.push(id);
        await db.query(`UPDATE ads SET ${updateFields.join(', ')} WHERE id = ?`, finalParams);
        
        // Delete old image if new one was uploaded
        if (oldImagePath && req.file) {
          try {
            const oldImageFullPath = path.join(__dirname, '../../public', oldImagePath);
            await fs.unlink(oldImageFullPath);
          } catch (unlinkError) {
            console.error('Error deleting old image:', unlinkError);
          }
        }
      }
      
      // Get updated ad
      const [updatedAd] = await db.query(`
        SELECT 
          a.*,
          ap.display_name as position_display_name,
          u.username as created_by_username,
          CASE 
            WHEN a.end_date <= NOW() THEN 'expired'
            WHEN a.is_active = false THEN 'inactive'
            ELSE 'active'
          END as status
        FROM ads a
        LEFT JOIN ads_positions ap ON a.position = ap.position_name
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.id = ?
      `, [id]);
      
      res.json({
        success: true,
        data: updatedAd[0],
        message: 'تم تحديث الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error updating ad:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي',
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
      
      // Get ad details before deletion
      const [ad] = await db.query('SELECT * FROM ads WHERE id = ?', [id]);
      if (ad.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // Delete the ad (this will cascade delete clicks and impressions)
      await db.query('DELETE FROM ads WHERE id = ?', [id]);
      
      // Delete the image file
      if (ad[0].image_path) {
        try {
          const imagePath = path.join(__dirname, '../../public', ad[0].image_path);
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          console.error('Error deleting image file:', unlinkError);
        }
      }
      
      res.json({
        success: true,
        message: 'تم حذف الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي',
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
      const { period = '7d' } = req.query;
      
      // Check if ad exists
      const [ad] = await db.query('SELECT * FROM ads WHERE id = ?', [id]);
      if (ad.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // Determine date range based on period
      let dateCondition = '';
      switch (period) {
        case '1d':
          dateCondition = 'AND DATE(created_at) = CURDATE()';
          break;
        case '7d':
          dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case '30d':
          dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        case 'all':
        default:
          dateCondition = '';
          break;
      }
      
      // Get click statistics
      const [clickStats] = await db.query(`
        SELECT 
          COUNT(*) as total_clicks,
          COUNT(DISTINCT ip_address) as unique_clicks,
          DATE(clicked_at) as click_date,
          COUNT(*) as daily_clicks
        FROM ads_clicks 
        WHERE ad_id = ? ${dateCondition.replace('created_at', 'clicked_at')}
        GROUP BY DATE(clicked_at)
        ORDER BY click_date DESC
      `, [id]);
      
      // Get impression statistics
      const [impressionStats] = await db.query(`
        SELECT 
          COUNT(*) as total_impressions,
          COUNT(DISTINCT ip_address) as unique_impressions,
          DATE(viewed_at) as impression_date,
          COUNT(*) as daily_impressions
        FROM ads_impressions 
        WHERE ad_id = ? ${dateCondition.replace('created_at', 'viewed_at')}
        GROUP BY DATE(viewed_at)
        ORDER BY impression_date DESC
      `, [id]);
      
      // Calculate totals
      const totalClicks = clickStats.reduce((sum, stat) => sum + stat.daily_clicks, 0);
      const totalImpressions = impressionStats.reduce((sum, stat) => sum + stat.daily_impressions, 0);
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
      
      res.json({
        success: true,
        data: {
          ad_info: ad[0],
          summary: {
            total_clicks: totalClicks,
            total_impressions: totalImpressions,
            click_through_rate: parseFloat(ctr),
            period: period
          },
          daily_stats: {
            clicks: clickStats,
            impressions: impressionStats
          }
        },
        message: 'تم جلب إحصائيات الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error fetching ad stats:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي',
        error: error.message
      });
    }
  }
);

// GET /admin/ads/stats/overview - Get overview statistics
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Determine date condition
    let dateCondition = '';
    switch (period) {
      case '1d':
        dateCondition = 'AND DATE(a.created_at) = CURDATE()';
        break;
      case '7d':
        dateCondition = 'AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        dateCondition = 'AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'all':
      default:
        dateCondition = '';
        break;
    }
    
    // Get general statistics
    const [generalStats] = await db.query(`
      SELECT 
        COUNT(*) as total_ads,
        SUM(CASE WHEN is_active = true AND end_date > NOW() THEN 1 ELSE 0 END) as active_ads,
        SUM(CASE WHEN end_date <= NOW() THEN 1 ELSE 0 END) as expired_ads,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_ads,
        SUM(clicks) as total_clicks,
        SUM(impressions) as total_impressions
      FROM ads a
      WHERE 1=1 ${dateCondition}
    `);
    
    // Get position statistics
    const [positionStats] = await db.query(`
      SELECT 
        a.position,
        ap.display_name,
        COUNT(*) as ad_count,
        SUM(a.clicks) as total_clicks,
        SUM(a.impressions) as total_impressions
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      WHERE 1=1 ${dateCondition}
      GROUP BY a.position, ap.display_name
      ORDER BY ad_count DESC
    `);
    
    const stats = generalStats[0];
    const ctr = stats.total_impressions > 0 ? (stats.total_clicks / stats.total_impressions * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        summary: {
          ...stats,
          click_through_rate: parseFloat(ctr),
          period: period
        },
        by_position: positionStats
      },
      message: 'تم جلب الإحصائيات العامة بنجاح'
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
      error: error.message
    });
  }
});

// POST /admin/ads/cleanup - Clean up expired ads
router.post('/cleanup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { delete_files = false } = req.body;
    
    // Get expired ads
    const [expiredAds] = await db.query(
      'SELECT id, image_path FROM ads WHERE end_date <= NOW()'
    );
    
    if (expiredAds.length === 0) {
      return res.json({
        success: true,
        message: 'لا توجد إعلانات منتهية الصلاحية للحذف',
        deleted_count: 0
      });
    }
    
    // Delete expired ads
    await db.query('DELETE FROM ads WHERE end_date <= NOW()');
    
    // Delete image files if requested
     let deletedFiles = 0;
     if (delete_files) {
       const deletePromises = expiredAds.map(async (ad) => {
         if (ad.image_path) {
           try {
             const imagePath = path.join(__dirname, '../../public', ad.image_path);
             await fs.unlink(imagePath);
             return true;
           } catch (unlinkError) {
             console.error('Error deleting image file:', unlinkError);
             return false;
           }
         }
         return false;
       });
       
       const results = await Promise.all(deletePromises);
       deletedFiles = results.filter(Boolean).length;
     }
    
    res.json({
      success: true,
      message: `تم حذف ${expiredAds.length} إعلان منتهي الصلاحية`,
      deleted_count: expiredAds.length,
      deleted_files: deletedFiles
    });
  } catch (error) {
    console.error('Error cleaning up expired ads:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
      error: error.message
    });
  }
});

module.exports = router;