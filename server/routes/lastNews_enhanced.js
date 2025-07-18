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

// GET active last news (public)
router.get('/active', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 5);
    const breakingNews = await query(
      'SELECT * FROM breaking_news WHERE is_active = 1 ORDER BY priority DESC, created_at DESC LIMIT ?',
      [limit]
    );
    const normalNews = await query(
      'SELECT id, title_ar as title, slug, created_at FROM posts WHERE is_published = 1 ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    const combined = [...breakingNews, ...normalNews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
    res.json({ success: true, data: combined });
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
    const news = await query(queryStr, params);
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single last news (public)
router.get('/:id', async (req, res) => {
  try {
    const news = await queryOne('SELECT * FROM last_news WHERE id = ?', [req.params.id]);
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
      [title_ar, content_ar, slug, priority, is_active]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update last news (admin)
router.put('/:id', auth, requireAdminOrEditor, validate(breakingNewsSchema), async (req, res) => {
  try {
    const { title_ar, content_ar, priority, is_active } = req.body;
    const slug = title_ar ? generateLastNewsSlug(title_ar) : undefined;
    await query(
      'UPDATE last_news SET title_ar = ?, content_ar = ?, slug = COALESCE(?, slug), priority = ?, is_active = ? WHERE id = ?',
      [title_ar, content_ar, slug, priority, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE last news (admin)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM last_news WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;