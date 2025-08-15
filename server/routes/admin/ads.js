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
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${  whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      ${whereClause}
    `;
    
    console.log('Executing countQuery:', countQuery);
console.log('With params:', queryParams);
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
    console.log('Executing adsQuery:', adsQuery);
console.log('With params:', finalParams);
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
      
      // Prepare update data
      const updateData = {};
      const updateParams = [];
      
      if (title !== undefined) {
        updateData.title = title;
        updateParams.push(title);
      }
      if (description !== undefined) {
        updateData.description = description;
        updateParams.push(description);
      }
      if (url !== undefined) {
        updateData.url = url;
        updateParams.push(url);
      }
      if (position !== undefined) {
        updateData.position = position;
        updateParams.push(position);
        
        // Update dimensions if position changed
        const [positionInfo] = await db.query(
          'SELECT width, height FROM ads_positions WHERE position_name = ?',
          [position]
        );
        if (positionInfo.length > 0) {
          updateData.width = positionInfo[0].width;
          updateData.height = positionInfo[0].height;
          updateParams.push(positionInfo[0].width, positionInfo[0].height);
        }
      }
      if (end_date !== undefined) {
        updateData.end_date = end_date;
        updateParams.push(end_date);
      }
      if (is_active !== undefined) {
        updateData.is_active = is_active;
        updateParams.push(is_active);
      }
      
      // Handle image update
      let oldImagePath = null;
      if (req.file) {
        oldImagePath = existingAd[0].image_path;
        const newImagePath = `/uploads/ads/${req.file.filename}`;
        updateData.image_path = newImagePath;
        updateParams.push(newImagePath);
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
      if (req.file) {
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
      
      // Get ad info before deletion
      const [adResult] = await db.query('SELECT * FROM ads WHERE id = ?', [id]);
      if (adResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // Delete ad from database
      await db.query('DELETE FROM ads WHERE id = ?', [id]);
      
      // Delete image file
      if (adResult[0].image_path) {
        try {
          const imagePath = path.join(__dirname, '../../public', adResult[0].image_path);
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
      
      // Check if ad exists
      const [ad] = await db.query('SELECT * FROM ads WHERE id = ?', [id]);
      if (ad.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // Get basic stats
      const [basicStats] = await db.query(`
        SELECT 
          clicks,
          impressions,
          CASE 
            WHEN impressions > 0 THEN ROUND((clicks / impressions) * 100, 2)
            ELSE 0
          END as ctr_percentage
        FROM ads 
        WHERE id = ?
      `, [id]);
      
      // Get daily stats for the last 30 days
      const [dailyStats] = await db.query(`
        SELECT 
          DATE(clicked_at) as date,
          COUNT(*) as clicks
        FROM ads_clicks 
        WHERE ad_id = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(clicked_at)
        ORDER BY date DESC
      `, [id]);
      
      const [dailyImpressions] = await db.query(`
        SELECT 
          DATE(viewed_at) as date,
          COUNT(*) as impressions
        FROM ads_impressions 
        WHERE ad_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(viewed_at)
        ORDER BY date DESC
      `, [id]);
      
      // Get top referrers
      const [topReferrers] = await db.query(`
        SELECT 
          COALESCE(referrer, 'Direct') as referrer,
          COUNT(*) as clicks
        FROM ads_clicks 
        WHERE ad_id = ?
        GROUP BY referrer
        ORDER BY clicks DESC
        LIMIT 10
      `, [id]);
      
      res.json({
        success: true,
        data: {
          basic: basicStats[0],
          daily_clicks: dailyStats,
          daily_impressions: dailyImpressions,
          top_referrers: topReferrers,
          ad_info: {
            id: ad[0].id,
            title: ad[0].title,
            position: ad[0].position,
            is_active: ad[0].is_active,
            start_date: ad[0].start_date,
            end_date: ad[0].end_date
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

// GET /admin/ads/stats/overview - Get ads overview statistics
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get overall stats
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(*) as total_ads,
        SUM(CASE WHEN is_active = true AND end_date > NOW() THEN 1 ELSE 0 END) as active_ads,
        SUM(CASE WHEN end_date <= NOW() THEN 1 ELSE 0 END) as expired_ads,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_ads,
        SUM(COALESCE(clicks, 0)) as total_clicks,
        SUM(COALESCE(impressions, 0)) as total_impressions,
        CASE 
          WHEN SUM(COALESCE(impressions, 0)) > 0 THEN ROUND((SUM(COALESCE(clicks, 0)) / SUM(COALESCE(impressions, 0))) * 100, 2)
          ELSE 0
        END as avg_ctr
      FROM ads
    `);
    
    // Get stats by position
    const [positionStats] = await db.query(`
      SELECT 
        ap.position_name,
        ap.display_name,
        ap.max_ads,
        COUNT(a.id) as total_ads,
        SUM(CASE WHEN a.is_active = true AND a.end_date > NOW() THEN 1 ELSE 0 END) as active_ads,
        SUM(COALESCE(a.clicks, 0)) as total_clicks,
        SUM(COALESCE(a.impressions, 0)) as total_impressions
      FROM ads_positions ap
      LEFT JOIN ads a ON ap.position_name = a.position
      GROUP BY ap.position_name, ap.display_name, ap.max_ads
      ORDER BY ap.id
    `);
    
    // Get recent activity
    const [recentActivity] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.position,
        ap.display_name as position_display_name,
        a.is_active,
        a.end_date,
        a.created_at,
        u.username as created_by,
        CASE 
          WHEN a.end_date <= NOW() THEN 'expired'
          WHEN a.is_active = false THEN 'inactive'
          ELSE 'active'
        END as status
      FROM ads a
      LEFT JOIN ads_positions ap ON a.position = ap.position_name
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        overall: overallStats[0],
        by_position: positionStats,
        recent_activity: recentActivity
      },
      message: 'تم جلب نظرة عامة على الإعلانات بنجاح'
    });
  } catch (error) {
    console.error('Error fetching ads overview:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
      error: error.message
    });
  }
});

// POST /admin/ads/cleanup - Manual cleanup of expired ads
router.post('/cleanup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get expired ads
    const [expiredAds] = await db.query(
      'SELECT id, title, image_path FROM ads WHERE end_date < NOW() AND is_active = true'
    );
    
    if (expiredAds.length === 0) {
      return res.json({
        success: true,
        data: {
          cleaned_ads: 0,
          deleted_images: 0,
          errors: []
        },
        message: 'لا توجد إعلانات منتهية الصلاحية للتنظيف'
      });
    }
    
    const errors = [];
    let deletedImages = 0;
    
    // Delete image files
    const deletePromises = expiredAds.map(async (ad) => {
      if (ad.image_path) {
        try {
          const imagePath = path.join(__dirname, '../../public', ad.image_path);
          await fs.unlink(imagePath);
          return { success: true };
        } catch (error) {
          return { success: false, error: `فشل في حذف صورة الإعلان ${ad.title}: ${error.message}` };
        }
      }
      return { success: true };
    });
    
    const deleteResults = await Promise.all(deletePromises);
    deleteResults.forEach((result) => {
      if (result.success) {
        deletedImages += 1;
      } else if (result.error) {
        errors.push(result.error);
      }
    });
    
    // Mark ads as inactive
    const [updateResult] = await db.query(
      'UPDATE ads SET is_active = false WHERE end_date < NOW() AND is_active = true'
    );
    
    res.json({
      success: true,
      data: {
        cleaned_ads: updateResult.affectedRows,
        deleted_images: deletedImages,
        errors: errors
      },
      message: `تم تنظيف ${updateResult.affectedRows} إعلان منتهي الصلاحية`
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
      error: error.message
    });
  }
});

module.exports = router;