const express = require('express');
const { body, validationResult, param } = require('express-validator');
const db = require('../../config/database.cjs');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth.cjs');

const router = express.Router();

// Slug generation function (adapted for Arabic)
const generateLastNewsSlug = (title_ar) => {
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

// Get all last news with pagination and filtering
router.get('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      active = '',
      priority = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(title_ar LIKE ? OR content_ar LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (active !== '') {
      whereConditions.push('is_active = ?');
      queryParams.push(active);
    }
    
    if (priority !== '') {
      whereConditions.push('priority = ?');
      queryParams.push(priority);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort parameters
    const allowedSortFields = ['title_ar', 'priority', 'is_active', 'created_at', 'updated_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    const queryStr = `
      SELECT *
      FROM last_news
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit, 10), offset);
    
    const [news] = await db.execute(queryStr, queryParams);
    
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM last_news ${whereClause}`,
      queryParams.slice(0, -2)
    );
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit, 10));
    
    res.json({
      success: true,
      data: news,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching last news:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single last news
router.get('/:id', authenticateToken, requireRole(['admin', 'editor']), param('id').isInt(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    
    const [news] = await db.execute('SELECT * FROM last_news WHERE id = ?', [req.params.id]);
    if (news.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: news[0] });
  } catch (error) {
    console.error('Error fetching last news:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create last news
router.post('/', authenticateToken, requireRole(['admin', 'editor']), [
  body('title_ar').trim().notEmpty(),
  body('content_ar').trim().notEmpty(),
  body('priority').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    
    const { title_ar, content_ar, priority = 0, is_active = 1 } = req.body;
    const slug = generateLastNewsSlug(title_ar);
    
    const [result] = await db.execute(
      'INSERT INTO last_news (title_ar, content_ar, slug, priority, is_active) VALUES (?, ?, ?, ?, ?)',
      [title_ar, content_ar, slug, priority, is_active]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creating last news:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update last news
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), [
  param('id').isInt(),
  body('title_ar').optional().trim(),
  body('content_ar').optional().trim(),
  body('priority').optional().isInt(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    
    const { title_ar, content_ar, priority, is_active } = req.body;
    const slug = title_ar ? generateLastNewsSlug(title_ar) : undefined;
    
    await db.execute(
      'UPDATE last_news SET title_ar = COALESCE(?, title_ar), content_ar = COALESCE(?, content_ar), slug = COALESCE(?, slug), priority = COALESCE(?, priority), is_active = COALESCE(?, is_active), updated_at = NOW() WHERE id = ?',
      [title_ar, content_ar, slug, priority, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating last news:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete last news
router.delete('/:id', authenticateToken, requireRole(['admin']), param('id').isInt(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    
    await db.execute('DELETE FROM last_news WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting last news:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;