const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { body, validationResult, param } = require('express-validator');
const db = require('../config/database');
const { auth: authenticateToken, requireRole } = require('../middlewares/auth');
const adExpirationService = require('../services/adExpirationService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

// Process ad image function
async function processAdImage(file, adId) {
  // Save images to server/public/uploads/ads
  const uploadPath = path.join(__dirname, '../public/uploads/ads');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  let filename = `ad_${adId}_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  let filePath = path.join(uploadPath, filename);

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const random = Math.random().toString(36).substring(2, 8);
    filename = `${base}-${random}${ext}`;
    filePath = path.join(uploadPath, filename);
  }

  await sharp(file.buffer)
    .resize({ width: 1280, withoutEnlargement: true })
    .toFormat('jpeg', { quality: 85 })
    .toFile(filePath);

  return `/uploads/ads/${filename}`;
}

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

// Get all ads with pagination and filtering
router.get('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      position = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(a.title LIKE ? OR a.link_url LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (position) {
      whereConditions.push('ap.name = ?');
      queryParams.push(position);
    }
    
    if (status === 'active') {
      whereConditions.push('a.is_active = 1 AND a.expire_date > NOW()');
    } else if (status === 'expired') {
      whereConditions.push('a.expire_date <= NOW()');
    } else if (status === 'inactive') {
      whereConditions.push('a.is_active = 0');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort parameters
    const validSortFields = ['created_at', 'title', 'expire_date', 'clicks', 'start_date'];
    const validSortOrders = ['ASC', 'DESC'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
      ${whereClause}
    `;
    
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;
    
    // Get ads data
    const dataQuery = `
      SELECT 
        a.id, a.title, a.image_path, a.link_url, a.start_date, a.expire_date,
        a.is_active, a.clicks, a.created_at, a.updated_at,
        ap.name as position_name, ap.name_ar as position_name_ar,
        ap.width, ap.height,
        u.username as created_by_username, u.display_name as created_by_name,
        CASE 
          WHEN a.expire_date <= NOW() THEN 'expired'
          WHEN a.is_active = 1 THEN 'active'
          ELSE 'inactive'
        END as status
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
      LEFT JOIN users u ON a.created_by = u.id
      ${whereClause}
      ORDER BY a.${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(parseInt(limit, 10), offset);
    const [ads] = await db.execute(dataQuery, queryParams);
    
    res.json({
      success: true,
      data: {
        ads,
        pagination: {
          current_page: parseInt(page, 10),
          per_page: parseInt(limit, 10),
          total,
          total_pages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Get single ad by ID
router.get('/:id', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ads] = await db.execute(`
      SELECT 
        a.*, 
        ap.name as position_name, ap.name_ar as position_name_ar,
        ap.width, ap.height,
        u.username as created_by_username, u.display_name as created_by_name
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
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
      data: ads[0]
    });
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Create new ad
router.post('/',
  authenticateToken,
  requireRole(['admin', 'editor']),
  upload.single('image'),
  [
    body('title').notEmpty().withMessage('عنوان الإعلان مطلوب'),
    body('link_url').isURL().withMessage('رابط الإعلان يجب أن يكون رابط صحيح'),
    body('position_id').isInt().withMessage('موقع الإعلان مطلوب'),
    body('expire_date').isISO8601().withMessage('تاريخ انتهاء الإعلان مطلوب')
  ],
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'صورة الإعلان مطلوبة'
        });
      }

      const { title, link_url, position_id, expire_date, start_date } = req.body;
      
      // Check if position exists and is active
      const [positions] = await db.execute(
        'SELECT id, width, height FROM ad_positions WHERE id = ? AND is_active = 1',
        [position_id]
      );
      
      if (positions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'موقع الإعلان غير موجود أو غير نشط'
        });
      }
      
      // Check if there's already an active ad in this position
      const [existingAds] = await db.execute(
        'SELECT id FROM ads WHERE position_id = ? AND is_active = 1 AND expire_date > NOW()',
        [position_id]
      );
      
      if (existingAds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'يوجد إعلان نشط بالفعل في هذا الموقع'
        });
      }
      
      // Insert ad first to get ID
      const [result] = await db.execute(
        `INSERT INTO ads (
          title, link_url, position_id, start_date, expire_date, 
          created_by, image_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          link_url,
          position_id,
          start_date || new Date(),
          expire_date,
          req.user.id,
          'temp' // Temporary path
        ]
      );
      
      const adId = result.insertId;
      
      // Process and save image
      const imagePath = await processAdImage(req.file, adId);
      
      // Update ad with actual image path
      await db.execute(
        'UPDATE ads SET image_path = ? WHERE id = ?',
        [imagePath, adId]
      );
      
      // Get the created ad
      const [newAd] = await db.execute(`
        SELECT 
          a.*, 
          ap.name as position_name, ap.name_ar as position_name_ar
        FROM ads a
        LEFT JOIN ad_positions ap ON a.position_id = ap.id
        WHERE a.id = ?
      `, [adId]);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء الإعلان بنجاح',
        data: newAd[0]
      });
    } catch (error) {
      console.error('Error creating ad:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Update ad
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'editor']),
  upload.single('image'),
  [
    param('id').isInt().withMessage('معرف الإعلان يجب أن يكون رقماً'),
    body('title').optional().notEmpty().withMessage('عنوان الإعلان لا يمكن أن يكون فارغاً'),
    body('link_url').optional().isURL().withMessage('رابط الإعلان يجب أن يكون رابط صحيح'),
    body('position_id').optional().isInt().withMessage('موقع الإعلان يجب أن يكون رقماً'),
    body('expire_date').optional().isISO8601().withMessage('تاريخ انتهاء الإعلان غير صحيح')
  ],
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
      const updateData = req.body;
      
      // Get existing ad
      const [existingAd] = await db.execute(
        'SELECT * FROM ads WHERE id = ?',
        [id]
      );
      
      if (existingAd.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      // If position is being changed, check for conflicts
      if (updateData.position_id && updateData.position_id !== existingAd[0].position_id) {
        const [conflictingAds] = await db.execute(
          'SELECT id FROM ads WHERE position_id = ? AND is_active = 1 AND expire_date > NOW() AND id != ?',
          [updateData.position_id, id]
        );
        
        if (conflictingAds.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'يوجد إعلان نشط بالفعل في هذا الموقع'
          });
        }
      }
      
      // Handle image update
      if (req.file) {
        // Delete old image
        if (existingAd[0].image_path) {
          const oldImagePath = path.join(__dirname, '../public', existingAd[0].image_path);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.image_path = await processAdImage(req.file, id);
      }
      
      // Prepare update fields
      const allowedUpdateFields = [
        'title', 'link_url', 'position_id', 'start_date', 'expire_date', 'is_active', 'image_path'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(updateData).forEach(key => {
        if (allowedUpdateFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات للتحديث'
        });
      }
      
      updateValues.push(id);
      
      await db.execute(
        `UPDATE ads SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );
      
      // Get updated ad
      const [updatedAd] = await db.execute(`
        SELECT 
          a.*, 
          ap.name as position_name, ap.name_ar as position_name_ar
        FROM ads a
        LEFT JOIN ad_positions ap ON a.position_id = ap.id
        WHERE a.id = ?
      `, [id]);
      
      res.json({
        success: true,
        message: 'تم تحديث الإعلان بنجاح',
        data: updatedAd[0]
      });
    } catch (error) {
      console.error('Error updating ad:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Delete ad
router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'editor']),
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
      const [existingAd] = await db.execute(
        `SELECT a.*, ap.name as position_name FROM ads a 
         LEFT JOIN ad_positions ap ON a.position_id = ap.id 
         WHERE a.id = ?`,
        [id]
      );
      
      if (existingAd.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعلان غير موجود'
        });
      }
      
      const ad = existingAd[0];
      
      // Move to inactive ads table
      await db.execute(
        `INSERT INTO ads_inactive (
          original_ad_id, title, image_path, link_url, position_name,
          start_date, expire_date, total_clicks, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ad.id, ad.title, ad.image_path, ad.link_url, ad.position_name,
          ad.start_date, ad.expire_date, ad.clicks, ad.created_by, ad.created_at
        ]
      );
      
      // Delete image file
      if (ad.image_path) {
        const imagePath = path.join(__dirname, '../public', ad.image_path);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete ad from main table
      await db.execute('DELETE FROM ads WHERE id = ?', [id]);
      
      res.json({
        success: true,
        message: 'تم حذف الإعلان بنجاح'
      });
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Get ad positions
router.get('/positions/list', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const [positions] = await db.execute(
      'SELECT * FROM ad_positions WHERE is_active = 1 ORDER BY name'
    );
    
    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching ad positions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Track ad click
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update click count
    await db.execute(
      'UPDATE ads SET clicks = clicks + 1 WHERE id = ? AND is_active = 1 AND expire_date > NOW()',
      [id]
    );
    
    res.json({
      success: true,
      message: 'تم تسجيل النقرة'
    });
  } catch (error) {
    console.error('Error tracking ad click:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل النقرة'
    });
  }
});

// Manual ad expiration cleanup
router.post('/cleanup/expired', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const result = await adExpirationService.manualCleanup();
    res.json({
      success: true,
      message: 'Manual cleanup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform manual cleanup',
      error: error.message
    });
  }
});

// Get ad expiration service status
router.get('/service/status', [
  authenticateToken,
  requireRole(['admin'])
], (req, res) => {
  try {
    const status = adExpirationService.getStatus();
    res.json({
      success: true,
      message: 'Service status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service status',
      error: error.message
    });
  }
});

module.exports = router;