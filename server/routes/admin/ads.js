const express = require('express');
const fs = require('fs').promises;
const multer = require('multer');
const path = require('path');
const db = require('../../config/database');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth');
const AdExpirationService = require('../../services/adExpirationService');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
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

// Get all ads with pagination and filtering
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Ads route started, query params:', req.query);
    const { page = 1, limit = 10, search = '', position_id = '', status = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    console.log('🔍 Parsed params:', { pageNum, limitNum, offset });
    
    let whereClause = '1=1';
    const queryParams = [];
    console.log('🔍 Initial whereClause and params set');
    
    // Add search filter
    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.link_url LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Add position filter
    if (position_id) {
      whereClause += ' AND a.position_id = ?';
      queryParams.push(position_id);
    }
    
    // Add status filter
    if (status === 'active') {
      whereClause += ' AND a.is_active = 1 AND a.expire_date > NOW()';
    } else if (status === 'inactive') {
      whereClause += ' AND a.is_active = 0';
    } else if (status === 'expired') {
      whereClause += ' AND a.expire_date <= NOW()';
    }
    
    // Get total count
    console.log('🔍 About to execute count query');
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
      WHERE ${whereClause}
    `;
    console.log('🔍 Count query:', countQuery);
    console.log('🔍 Query params:', queryParams);

    const [countResult] = await db.execute(countQuery, queryParams);
    console.log('🔍 Count result:', countResult);
    const total = countResult[0].total;
    console.log('🔍 Total count:', total);
    
    // Get ads with pagination
    console.log('🔍 About to execute ads query');
    const adsQuery = `
      SELECT 
        a.id,
        a.title,
        a.image_path,
        a.link_url,
        a.position_id,
        a.start_date,
        a.expire_date,
        a.is_active,
        a.clicks,
        a.created_by,
        a.created_at,
        a.updated_at,
        ap.name as position_name,
        ap.name_ar as position_name_ar,
        u.username as created_by_username
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    console.log('🔍 Ads query:', adsQuery);
    console.log('🔍 Final query params:', [...queryParams, limitNum, offset]);

    const [ads] = await db.execute(adsQuery, [...queryParams, limitNum, offset]);
    console.log('🔍 Ads result:', ads);
    
    res.json({
      success: true,
      data: {
        ads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ads] = await db.execute(`
      SELECT 
        a.*,
        ap.name as position_name,
        ap.name_ar as position_name_ar,
        u.username as created_by_username
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
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, link_url, position_id, expire_date, is_active = true } = req.body;
    
    // Validation
    if (!title || !link_url || !position_id || !expire_date) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'صورة الإعلان مطلوبة'
      });
    }
    
    // Check if position exists
    const [positions] = await db.execute(
      'SELECT id FROM ad_positions WHERE id = ? AND is_active = 1',
      [position_id]
    );
    
    if (positions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'موضع الإعلان غير صحيح'
      });
    }
    
    // Check for existing active ad in the same position
    const [existingAds] = await db.execute(
      'SELECT id FROM ads WHERE position_id = ? AND is_active = 1 AND expire_date > NOW()',
      [position_id]
    );
    
    if (existingAds.length > 0 && is_active) {
      return res.status(400).json({
        success: false,
        message: 'يوجد إعلان نشط بالفعل في هذا الموضع'
      });
    }
    
    const imagePath = `/uploads/ads/${req.file.filename}`;
    
    // Insert ad
    const [result] = await db.execute(`
      INSERT INTO ads (
        title, image_path, link_url, position_id, 
        expire_date, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      title, imagePath, link_url, position_id,
      expire_date, is_active ? 1 : 0, req.user.id
    ]);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الإعلان بنجاح',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الإعلان'
    });
  }
});

// Update ad
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link_url, position_id, expire_date, is_active } = req.body;
    
    // Check if ad exists
    const [existingAds] = await db.execute('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (existingAds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }
    
    const existingAd = existingAds[0];
    let imagePath = existingAd.image_path;
    
    // Handle image update
    if (req.file) {
      // Delete old image
      try {
        const oldImagePath = path.join(__dirname, '../../', existingAd.image_path);
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.log('Could not delete old image:', error.message);
      }
      
      imagePath = `/uploads/ads/${req.file.filename}`;
    }
    
    // Check for conflicts with other active ads in the same position
    if (position_id && is_active) {
      const [conflictingAds] = await db.execute(
        'SELECT id FROM ads WHERE position_id = ? AND is_active = 1 AND expire_date > NOW() AND id != ?',
        [position_id, id]
      );
      
      if (conflictingAds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'يوجد إعلان نشط بالفعل في هذا الموضع'
        });
      }
    }
    
    // Update ad
    await db.execute(`
      UPDATE ads SET 
        title = COALESCE(?, title),
        image_path = ?,
        link_url = COALESCE(?, link_url),
        position_id = COALESCE(?, position_id),
        expire_date = COALESCE(?, expire_date),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id = ?
    `, [
      title, imagePath, link_url, position_id,
      expire_date, is_active ? 1 : 0, id
    ]);
    
    res.json({
      success: true,
      message: 'تم تحديث الإعلان بنجاح'
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإعلان'
    });
  }
});

// Delete ad
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get ad info first
    const [ads] = await db.execute('SELECT image_path FROM ads WHERE id = ?', [id]);
    
    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }
    
    const ad = ads[0];
    
    // Delete ad from database
    await db.execute('DELETE FROM ads WHERE id = ?', [id]);
    
    // Delete image file
    try {
      const imagePath = path.join(__dirname, '../../', ad.image_path);
      await fs.unlink(imagePath);
    } catch (error) {
      console.log('Could not delete image file:', error.message);
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

// Toggle ad status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const [ads] = await db.execute('SELECT is_active, position_id FROM ads WHERE id = ?', [id]);
    
    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الإعلان غير موجود'
      });
    }
    
    const ad = ads[0];
    const newStatus = !ad.is_active;
    
    // If activating, check for conflicts
    if (newStatus) {
      const [conflictingAds] = await db.execute(
        'SELECT id FROM ads WHERE position_id = ? AND is_active = 1 AND expire_date > NOW() AND id != ?',
        [ad.position_id, id]
      );
      
      if (conflictingAds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'يوجد إعلان نشط بالفعل في هذا الموضع'
        });
      }
    }
    
    // Update status
    await db.execute('UPDATE ads SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus ? 1 : 0, id]);
    
    res.json({
      success: true,
      message: newStatus ? 'تم تفعيل الإعلان' : 'تم إلغاء تفعيل الإعلان'
    });
  } catch (error) {
    console.error('Error toggling ad status:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تغيير حالة الإعلان'
    });
  }
});

// Get ad positions for dropdown
router.get('/positions/list', async (req, res) => {
  try {
    const [positions] = await db.execute(
      'SELECT id, name, name_ar, width, height FROM ad_positions WHERE is_active = 1 ORDER BY name'
    );
    
    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching ad positions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحميل مواضع الإعلانات'
    });
  }
});

// Manual cleanup of expired ads
router.post('/cleanup', async (req, res) => {
  try {
    await AdExpirationService.manualCleanup();
    
    res.json({
      success: true,
      message: 'تم تنظيف الإعلانات المنتهية الصلاحية بنجاح'
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تنظيف الإعلانات'
    });
  }
});

module.exports = router;