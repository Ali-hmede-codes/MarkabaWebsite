const express = require('express');
const { query } = require('../db')
const { auth: authenticateToken } = require('../middlewares/auth')
const { validateSocialMedia } = require('../middlewares/validation')

const router = express.Router();

// Get all social media links (public)
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM social_media WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching social media:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب روابط وسائل التواصل الاجتماعي'
    });
  }
});

// Get all social media links for admin (includes inactive)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM social_media ORDER BY sort_order ASC'
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching social media for admin:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب روابط وسائل التواصل الاجتماعي'
    });
  }
});

// Get single social media link
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      'SELECT * FROM social_media WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'رابط وسائل التواصل غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching social media:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب رابط وسائل التواصل'
    });
  }
});

// Create new social media link (admin only)
router.post('/', authenticateToken, validateSocialMedia, async (req, res) => {
  try {
    const { platform, name_ar, url, icon, color, sort_order, is_active } = req.body;
    
    const result = await query(
      'INSERT INTO social_media (platform, name_ar, url, icon, color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [platform, name_ar, url, icon, color || '#000000', sort_order || 0, is_active ? 1 : 0]
    );
    
    const newSocialMedia = await query(
      'SELECT * FROM social_media WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء رابط وسائل التواصل بنجاح',
      data: newSocialMedia[0]
    });
  } catch (error) {
    console.error('Error creating social media:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء رابط وسائل التواصل'
    });
  }
});

// Update social media link (admin only)
router.put('/:id', authenticateToken, validateSocialMedia, async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, name_ar, url, icon, color, sort_order, is_active } = req.body;
    
    const result = await query(
      'UPDATE social_media SET platform = ?, name_ar = ?, url = ?, icon = ?, color = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [platform, name_ar, url, icon, color, sort_order, is_active ? 1 : 0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'رابط وسائل التواصل غير موجود'
      });
    }
    
    const updatedSocialMedia = await query(
      'SELECT * FROM social_media WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'تم تحديث رابط وسائل التواصل بنجاح',
      data: updatedSocialMedia[0]
    });
  } catch (error) {
    console.error('Error updating social media:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث رابط وسائل التواصل'
    });
  }
});

// Delete social media link (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM social_media WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'رابط وسائل التواصل غير موجود'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف رابط وسائل التواصل بنجاح'
    });
  } catch (error) {
    console.error('Error deleting social media:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف رابط وسائل التواصل'
    });
  }
});

// Update sort order (admin only)
router.patch('/reorder', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body; // Array of {id, sort_order}
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'البيانات المرسلة غير صحيحة'
      });
    }
    
    // Validate each item has required fields
    const invalidItem = items.find(item => 
      item.id === undefined || item.id === null || typeof item.sort_order !== 'number'
    );
    
    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message: 'كل عنصر يجب أن يحتوي على id صحيح و sort_order رقمي'
      });
    }

    // Update sort order for each item using Promise.all for concurrent execution
    const updatePromises = items.map(async (item) => {
      const updateResult = await query(
        'UPDATE social_media SET sort_order = ? WHERE id = ?',
        [item.sort_order, item.id]
      );
      
      if (updateResult.affectedRows === 0) {
        throw new Error(`عنصر وسائل التواصل بالمعرف ${item.id} غير موجود`);
      }
      
      return updateResult;
    });
    
    try {
      await Promise.all(updatePromises);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث ترتيب روابط وسائل التواصل بنجاح'
    });
  } catch (error) {
    console.error('Error reordering social media:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث ترتيب روابط وسائل التواصل'
    });
  }
});

module.exports = router;