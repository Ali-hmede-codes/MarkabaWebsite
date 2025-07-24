const express = require('express');
const { query, queryOne } = require('../db');
const { validate, breakingNewsSchema } = require('../middlewares/validation'); // Reuse or adapt schema
const { auth, requireAdmin, requireAdminOrEditor } = require('../middlewares/auth');

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

function prepareParams(params) {
  return params.map(p => typeof p === 'number' ? String(p) : p);
}

// GET active last news (public)
router.get('/active', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 5);
    const lastNews = await query(
      'SELECT * FROM last_news WHERE is_active = 1 ORDER BY priority DESC, created_at DESC LIMIT ?',
      prepareParams([limit])
    );
    res.json({ success: true, data: lastNews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all last news with filters (admin)
router.get('/', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const { active, priority, limit = 10, offset = 0 } = req.query;
    let queryStr = 'SELECT * FROM last_news';
    const params = [];
    if (active !== undefined) {
      queryStr += ' WHERE is_active = ?';
      params.push(active);
    }
    if (priority) {
      queryStr += params.length ? ' AND' : ' WHERE';
      queryStr += ' priority = ?';
      params.push(priority);
    }
    queryStr += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const news = await query(queryStr, prepareParams(params));
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



// GET single last news (public)
router.get('/:id', async (req, res) => {
  try {
    const news = await queryOne('SELECT * FROM last_news WHERE id = ?', prepareParams([req.params.id]));
    if (!news) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create last news (admin)
router.post('/', auth, requireAdminOrEditor, validate(breakingNewsSchema), async (req, res) => {
  try {
    const { title_ar, content_ar, priority = 0, is_active = 1 } = req.body;
    const slug = generateLastNewsSlug(title_ar);
    const result = await query(
      'INSERT INTO last_news (title_ar, content_ar, slug, priority, is_active) VALUES (?, ?, ?, ?, ?)',
      prepareParams([title_ar, content_ar, slug, priority, is_active])
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update last news (admin)
router.put('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const { title_ar, content_ar, priority, is_active } = req.body;
    const setClauses = [];
    const params = [];

    if (title_ar !== undefined) {
      setClauses.push('title_ar = ?');
      params.push(title_ar);
      const slug = generateLastNewsSlug(title_ar);
      setClauses.push('slug = ?');
      params.push(slug);
    }
    if (content_ar !== undefined) {
      setClauses.push('content_ar = ?');
      params.push(content_ar);
    }
    if (priority !== undefined) {
      setClauses.push('priority = ?');
      params.push(priority);
    }
    if (is_active !== undefined) {
      setClauses.push('is_active = ?');
      params.push(is_active);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const queryStr = `UPDATE last_news SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(req.params.id);

    await query(queryStr, prepareParams(params));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE last news (admin)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM last_news WHERE id = ?', prepareParams([req.params.id]));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;