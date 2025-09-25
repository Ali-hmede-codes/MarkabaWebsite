const express = require('express');

const router = express.Router();
const db = require('../../config/database');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth');
const oneSignalService = require('../../services/oneSignalService');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'editor', 'author']));

// Slug generation function (adapted for Arabic)
const generateSlug = (title_ar) => {
  const arabicMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
    'ء': '', 'ئ': 'y', 'ؤ': 'w', 'لا': 'la'
  };
  
  const slug = title_ar.toLowerCase()
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (match) => arabicMap[match] || match)
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
    
  return slug || 'last-news';
};

// GET /api/admin/administratorpage/last-news - Get all last news
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, title_ar, content_ar, slug, priority, is_active, views, created_at, updated_at
      FROM last_news 
      ORDER BY priority DESC, created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Error fetching last news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب آخر الأخبار'
    });
  }
});

// POST /api/admin/administratorpage/last-news - Create new last news
router.post('/', async (req, res) => {
  try {
    const { title_ar, content_ar, priority, is_active } = req.body;
    
    // Validation
    if (!title_ar || title_ar.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'عنوان الخبر مطلوب'
      });
    }
    
    // Generate slug from title
    const slug = generateSlug(title_ar);
    
    const query = `
      INSERT INTO last_news (title_ar, content_ar, slug, priority, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      title_ar.trim(),
      content_ar ? content_ar.trim() : '',
      slug,
      priority || 1,
      is_active !== undefined ? is_active : true
    ]);
    
    // Get the created item
    const [newItem] = await db.execute(
      'SELECT * FROM last_news WHERE id = ?',
      [result.insertId]
    );
    
    // Send OneSignal push notification for last news
    try {
      await oneSignalService.sendLastNewsNotification({
        id: newItem[0].id,
        title_ar: title_ar,
        content_ar: content_ar || title_ar,
        slug: newItem[0].slug
      });
      console.log('OneSignal notification sent for last news:', title_ar);
    } catch (notificationError) {
      console.error('Failed to send OneSignal notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة الخبر بنجاح',
      data: newItem[0]
    });
  } catch (error) {
    console.error('Error creating last news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة الخبر'
    });
  }
});

// PUT /api/admin/administratorpage/last-news/:id - Update last news
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title_ar, content_ar, priority, is_active } = req.body;
    
    // Check if last news exists
    const [existing] = await db.execute(
      'SELECT id FROM last_news WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الخبر غير موجود'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (title_ar !== undefined) {
      updates.push('title_ar = ?');
      values.push(title_ar.trim());
      
      // Update slug when title changes
      updates.push('slug = ?');
      values.push(generateSlug(title_ar));
    }
    
    if (content_ar !== undefined) {
      updates.push('content_ar = ?');
      values.push(content_ar.trim());
    }
    
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد بيانات للتحديث'
      });
    }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    const query = `UPDATE last_news SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.execute(query, values);
    
    // Get updated item
    const [updatedItem] = await db.execute(
      'SELECT * FROM last_news WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'تم تحديث الخبر بنجاح',
      data: updatedItem[0]
    });
  } catch (error) {
    console.error('Error updating last news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الخبر'
    });
  }
});

// DELETE /api/admin/administratorpage/last-news/:id - Delete last news
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if last news exists
    const [existing] = await db.execute(
      'SELECT id, title_ar FROM last_news WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الخبر غير موجود'
      });
    }
    
    // Delete the last news
    await db.execute('DELETE FROM last_news WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'تم حذف الخبر بنجاح'
    });
  } catch (error) {
    console.error('Error deleting last news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الخبر'
    });
  }
});

// GET /api/admin/administratorpage/last-news/:id - Get single last news
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.execute(
      'SELECT * FROM last_news WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الخبر غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching last news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الخبر'
    });
  }
});

module.exports = router;