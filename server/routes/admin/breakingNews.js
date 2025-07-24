const express = require('express');

const router = express.Router();
const db = require('../../config/database');
const { authenticateToken, requireAdmin } = require('../../middlewares/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Helper function to generate Arabic slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]/g, '') // Keep only Arabic characters and spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// GET /api/admin/administratorpage/breaking-news - Get all breaking news
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, title_ar, content_ar, slug, link, priority, is_active, views, created_at, updated_at
      FROM breaking_news 
      ORDER BY priority DESC, created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأخبار العاجلة'
    });
  }
});

// POST /api/admin/administratorpage/breaking-news - Create new breaking news
router.post('/', async (req, res) => {
  try {
    const { title_ar, content_ar, link, priority, is_active } = req.body;
    
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
      INSERT INTO breaking_news (title_ar, content_ar, slug, link, priority, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      title_ar.trim(),
      content_ar ? content_ar.trim() : '',
      slug,
      link || null,
      priority || 1,
      is_active !== undefined ? is_active : true
    ]);
    
    // Get the created item
    const [newItem] = await db.execute(
      'SELECT * FROM breaking_news WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة الخبر العاجل بنجاح',
      data: newItem[0]
    });
  } catch (error) {
    console.error('Error creating breaking news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة الخبر العاجل'
    });
  }
});

// PUT /api/admin/administratorpage/breaking-news/:id - Update breaking news
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title_ar, content_ar, link, priority, is_active } = req.body;
    
    // Check if breaking news exists
    const [existing] = await db.execute(
      'SELECT id FROM breaking_news WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الخبر العاجل غير موجود'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (title_ar !== undefined) {
      updates.push('title_ar = ?');
      values.push(title_ar.trim());
      
      // Update slug if title changes
      updates.push('slug = ?');
      values.push(generateSlug(title_ar));
    }
    
    if (content_ar !== undefined) {
      updates.push('content_ar = ?');
      values.push(content_ar.trim());
    }
    
    if (link !== undefined) {
      updates.push('link = ?');
      values.push(link || null);
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
    
    const query = `UPDATE breaking_news SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.execute(query, values);
    
    // Get updated item
    const [updatedItem] = await db.execute(
      'SELECT * FROM breaking_news WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'تم تحديث الخبر العاجل بنجاح',
      data: updatedItem[0]
    });
  } catch (error) {
    console.error('Error updating breaking news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الخبر العاجل'
    });
  }
});

// DELETE /api/admin/administratorpage/breaking-news/:id - Delete breaking news
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if breaking news exists
    const [existing] = await db.execute(
      'SELECT id, title_ar FROM breaking_news WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الخبر العاجل غير موجود'
      });
    }
    
    // Delete the breaking news
    await db.execute('DELETE FROM breaking_news WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'تم حذف الخبر العاجل بنجاح'
    });
  } catch (error) {
    console.error('Error deleting breaking news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الخبر العاجل'
    });
  }
});

// GET /api/admin/administratorpage/breaking-news/:id - Get single breaking news
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.execute(
      'SELECT * FROM breaking_news WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الخبر العاجل غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الخبر العاجل'
    });
  }
});

// POST /api/admin/administratorpage/breaking-news/:id/toggle - Toggle active status
router.post('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const [current] = await db.execute(
      'SELECT is_active FROM breaking_news WHERE id = ?',
      [id]
    );
    
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الخبر العاجل غير موجود'
      });
    }
    
    const newStatus = !current[0].is_active;
    
    await db.execute(
      'UPDATE breaking_news SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    res.json({
      success: true,
      message: `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} الخبر العاجل`,
      data: { is_active: newStatus }
    });
  } catch (error) {
    console.error('Error toggling breaking news status:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تغيير حالة الخبر العاجل'
    });
  }
});

module.exports = router;