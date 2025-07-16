const express = require('express');
const { query, queryOne } = require('../db');
const { validate, breakingNewsSchema } = require('../middlewares/validation');
const { auth, requireAdmin, requireAdminOrEditor } = require('../middlewares/auth');

const router = express.Router();

// Enhanced Arabic slug generation for breaking news
const generateBreakingNewsSlug = (title, title_ar) => {
  const sourceTitle = title_ar || title;
  
  const arabicMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
    'ء': '', 'ئ': 'y', 'ؤ': 'w', 'لا': 'la'
  };
  
  const slug = sourceTitle.toLowerCase()
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (match) => arabicMap[match] || match)
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
    
  return slug || 'breaking-news';
};

// Get active breaking news (up to 5 items) - Public endpoint (NO AUTH REQUIRED)
router.get('/active', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 5); // Max 5 breaking news
    const { language, include_content = 'false' } = req.query;
    
    let queryStr = `
      SELECT id, title_ar as title, ${include_content === 'true' ? 'content_ar as content,' : ''}
             slug, priority, views, created_at, updated_at
      FROM breaking_news 
      WHERE is_active = 1
    `;
    
    const params = [];
    
    // Language filtering (Arabic only)
    if (language) {
      if (language === 'ar') {
        queryStr += ' AND (title_ar IS NOT NULL AND title_ar != "")';
      }
      // Note: English not supported in Arabic-only database
    }
    
    queryStr += ' ORDER BY priority DESC, created_at DESC LIMIT ?';
    params.push(limit);
    
    const breakingNews = await query(queryStr, params);
    
    const processedNews = breakingNews.map(news => ({
      ...news,
      is_active: true,
      url: `/breaking/${news.id}/${news.slug}`
    }));
    
    res.json({
      success: true,
      data: processedNews,
      meta: {
        total: processedNews.length,
        limit,
        language: language || 'all'
      }
    });
    
  } catch (error) {
    console.error('Error fetching active breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breaking news',
      message: error.message
    });
  }
});

// Get latest breaking news (single item) - Public endpoint
router.get('/latest', async (req, res) => {
  try {
    const { language, include_content = 'true' } = req.query;
    
    let queryStr = `
      SELECT id, title_ar as title, ${include_content === 'true' ? 'content_ar as content,' : ''}
             slug, priority, views, created_at, updated_at
      FROM breaking_news 
      WHERE is_active = 1
    `;
    
    const params = [];
    
    // Language filtering (Arabic only)
    if (language) {
      if (language === 'ar') {
        queryStr += ' AND (title_ar IS NOT NULL AND title_ar != "")';
      }
      // Note: English not supported in Arabic-only database
    }
    
    queryStr += ' ORDER BY priority DESC, created_at DESC LIMIT 1';
    
    const breakingNews = await queryOne(queryStr, params);
    
    if (!breakingNews) {
      return res.json({
        success: true,
        data: null,
        message: 'No active breaking news found'
      });
    }
    
    const processedNews = {
      ...breakingNews,
      is_active: true,
      url: `/breaking/${breakingNews.id}/${breakingNews.slug}`
    };
    
    res.json({
      success: true,
      data: processedNews
    });
    
  } catch (error) {
    console.error('Error fetching latest breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest breaking news',
      message: error.message
    });
  }
});

// Get single breaking news by ID and slug - Public endpoint
router.get('/:id/:slug', async (req, res) => {
  try {
    const { id, slug } = req.params;
    const { track_view = 'true' } = req.query;
    
    const breakingNews = await queryOne(
      'SELECT * FROM breaking_news WHERE id = ? AND slug = ? AND is_active = 1',
      [id, slug]
    );
    
    if (!breakingNews) {
      return res.status(404).json({
        success: false,
        error: 'Breaking news not found',
        message: 'The requested breaking news does not exist or is not active'
      });
    }
    
    // Track view if requested
    if (track_view === 'true') {
      await query('UPDATE breaking_news SET views = views + 1 WHERE id = ?', [breakingNews.id]);
      breakingNews.views += 1;
    }
    
    const processedNews = {
      ...breakingNews,
      is_active: Boolean(breakingNews.is_active),
      url: `/breaking/${breakingNews.id}/${breakingNews.slug}`
    };
    
    res.json({
      success: true,
      data: processedNews
    });
    
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breaking news',
      message: error.message
    });
  }
});

// Get all breaking news with enhanced filtering (Admin/Editor only)
router.get('/', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = (page - 1) * limit;
    
    const {
      status = 'all', // 'active', 'inactive', 'all'
      search,
      language,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc',
      min_priority,
      max_priority,
      min_views,
      max_views
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['created_at', 'updated_at', 'title', 'priority', 'views'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';
    
    let queryStr = 'SELECT * FROM breaking_news WHERE 1=1';
    const params = [];
    
    // Apply filters
    if (status !== 'all') {
      if (status === 'active') {
        queryStr += ' AND is_active = 1';
      } else if (status === 'inactive') {
        queryStr += ' AND is_active = 0';
      }
    }
    
    if (search) {
      queryStr += ' AND (title_ar LIKE ? OR content_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (language) {
      if (language === 'ar') {
        queryStr += ' AND (title_ar IS NOT NULL AND title_ar != "")';
      }
      // Note: English not supported in Arabic-only database
    }
    
    if (date_from) {
      queryStr += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      queryStr += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }
    
    if (min_priority) {
      queryStr += ' AND priority >= ?';
      params.push(parseInt(min_priority, 10));
    }
    
    if (max_priority) {
      queryStr += ' AND priority <= ?';
      params.push(parseInt(max_priority, 10));
    }
    
    if (min_views) {
      queryStr += ' AND views >= ?';
      params.push(parseInt(min_views, 10));
    }
    
    if (max_views) {
      queryStr += ' AND views <= ?';
      params.push(parseInt(max_views, 10));
    }
    
    // Count total
    const countQuery = queryStr.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = await query(countQuery, params);
    const total = totalResult[0].total;
    
    // Add ordering and pagination
    queryStr += ` ORDER BY ${finalSortBy} ${finalSortOrder.toUpperCase()} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    
    const breakingNews = await query(queryStr, params);
    
    const processedNews = breakingNews.map(news => ({
      ...news,
      is_active: Boolean(news.is_active),
      url: `/breaking/${news.id}/${news.slug}`
    }));
    
    res.json({
      success: true,
      data: {
        breaking_news: processedNews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          status,
          search,
          language,
          date_from,
          date_to,
          sort_by: finalSortBy,
          sort_order: finalSortOrder
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breaking news',
      message: error.message
    });
  }
});

// Create new breaking news (Admin only)
router.post('/', auth, requireAdmin, validate(breakingNewsSchema), async (req, res) => {
  try {
    const {
      title_ar,
      content_ar,
      priority = 1,
      is_active = true
    } = req.body;
    
    // Validate required fields
    if (!title_ar) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'title_ar is required'
      });
    }
    
    if (!content_ar) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'content_ar is required'
      });
    }
    
    // Generate slug
    const baseSlug = generateBreakingNewsSlug(null, title_ar);
    let slug = baseSlug;
    
    // Ensure slug uniqueness
    const existingSlugs = await query('SELECT slug FROM breaking_news WHERE slug LIKE ?', [`${baseSlug}%`]);
    const slugSet = new Set(existingSlugs.map(row => row.slug));
    
    let finalSlug = slug;
    let slugCounter = 1;
    while (slugSet.has(finalSlug)) {
      finalSlug = `${baseSlug}-${slugCounter}`;
      slugCounter += 1;
    }
    slug = finalSlug;
    
    // If setting as active, deactivate all other breaking news
    if (is_active) {
      await query('UPDATE breaking_news SET is_active = 0');
    }
    
    // Insert new breaking news
    const result = await query(
      `INSERT INTO breaking_news (
        title_ar, content_ar, slug, priority, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [title_ar, content_ar, slug, priority, is_active ? 1 : 0]
    );
    
    const newsId = result.insertId;
    
    // Fetch the created breaking news
    const createdNews = await queryOne(
      'SELECT * FROM breaking_news WHERE id = ?',
      [newsId]
    );
    
    const processedNews = {
      ...createdNews,
      is_active: Boolean(createdNews.is_active),
      url: `/breaking/${createdNews.id}/${createdNews.slug}`
    };
    
    res.status(201).json({
      success: true,
      message: 'Breaking news created successfully',
      data: processedNews
    });
    
  } catch (error) {
    console.error('Error creating breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create breaking news',
      message: error.message
    });
  }
});

// Update breaking news (Admin only)
router.put('/:id', auth, requireAdmin, validate(breakingNewsSchema), async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    
    // Check if breaking news exists
    const existingNews = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [newsId]);
    if (!existingNews) {
      return res.status(404).json({
        success: false,
        error: 'Breaking news not found',
        message: 'The requested breaking news does not exist'
      });
    }
    
    const {
      title_ar,
      content_ar,
      priority,
      is_active
    } = req.body;
    
    // Handle slug regeneration if title changed
    let slug = existingNews.slug;
    if (title_ar && title_ar !== existingNews.title_ar) {
      const baseSlug = generateBreakingNewsSlug(null, title_ar);
      slug = baseSlug;
      
      // Ensure slug uniqueness (excluding current news)
      const existingSlugs = await query('SELECT slug FROM breaking_news WHERE slug LIKE ? AND id != ?', [`${baseSlug}%`, newsId]);
      const slugSet = new Set(existingSlugs.map(row => row.slug));
      
      let finalSlug = slug;
      let slugCounter = 1;
      while (slugSet.has(finalSlug)) {
        finalSlug = `${baseSlug}-${slugCounter}`;
        slugCounter += 1;
      }
      slug = finalSlug;
    }
    
    // If setting as active, deactivate all other breaking news
    if (is_active && !existingNews.is_active) {
      await query('UPDATE breaking_news SET is_active = 0 WHERE id != ?', [newsId]);
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (title_ar !== undefined) {
      updateFields.push('title_ar = ?');
      updateValues.push(title_ar);
    }
    if (content_ar !== undefined) {
      updateFields.push('content_ar = ?');
      updateValues.push(content_ar);
    }
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }
    
    // Always update these fields
    updateFields.push('slug = ?', 'updated_at = NOW()');
    updateValues.push(slug);
    
    // Add news ID for WHERE clause
    updateValues.push(newsId);
    
    // Execute update
    await query(
      `UPDATE breaking_news SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated breaking news
    const updatedNews = await queryOne(
      'SELECT * FROM breaking_news WHERE id = ?',
      [newsId]
    );
    
    const processedNews = {
      ...updatedNews,
      is_active: Boolean(updatedNews.is_active),
      url: `/breaking/${updatedNews.id}/${updatedNews.slug}`
    };
    
    res.json({
      success: true,
      message: 'Breaking news updated successfully',
      data: processedNews
    });
    
  } catch (error) {
    console.error('Error updating breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update breaking news',
      message: error.message
    });
  }
});

// Toggle breaking news active status (Admin only)
router.patch('/:id/toggle', auth, requireAdmin, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    
    // Check if breaking news exists
    const existingNews = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [newsId]);
    if (!existingNews) {
      return res.status(404).json({
        success: false,
        error: 'Breaking news not found',
        message: 'The requested breaking news does not exist'
      });
    }
    
    const newStatus = !existingNews.is_active;
    
    // If activating, deactivate all other breaking news
    if (newStatus) {
      await query('UPDATE breaking_news SET is_active = 0 WHERE id != ?', [newsId]);
    }
    
    // Update the status
    await query(
      'UPDATE breaking_news SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus ? 1 : 0, newsId]
    );
    
    res.json({
      success: true,
      message: `Breaking news ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: newsId,
        is_active: newStatus
      }
    });
    
  } catch (error) {
    console.error('Error toggling breaking news status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle breaking news status',
      message: error.message
    });
  }
});

// Delete breaking news (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    
    // Check if breaking news exists
    const existingNews = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [newsId]);
    if (!existingNews) {
      return res.status(404).json({
        success: false,
        error: 'Breaking news not found',
        message: 'The requested breaking news does not exist'
      });
    }
    
    // Delete breaking news
    await query('DELETE FROM breaking_news WHERE id = ?', [newsId]);
    
    res.json({
      success: true,
      message: 'Breaking news deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete breaking news',
      message: error.message
    });
  }
});

// Get breaking news statistics (Admin/Editor only)
router.get('/stats/overview', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
        AVG(priority) as avg_priority,
        MAX(priority) as max_priority,
        MIN(priority) as min_priority,
        SUM(views) as total_views,
        AVG(views) as avg_views,
        MAX(views) as max_views,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recent_count
      FROM breaking_news
    `);
    
    const topNews = await query(`
      SELECT id, title, title_ar, views, priority, is_active
      FROM breaking_news 
      ORDER BY views DESC 
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        summary: stats[0],
        top_breaking_news: topNews.map(news => ({
          ...news,
          is_active: Boolean(news.is_active)
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching breaking news statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Bulk operations for breaking news (Admin only)
router.patch('/bulk/status', auth, requireAdmin, async (req, res) => {
  try {
    const { news_ids, is_active } = req.body;
    
    if (!Array.isArray(news_ids) || news_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'news_ids must be a non-empty array'
      });
    }
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'is_active must be a boolean'
      });
    }
    
    // If activating any news, deactivate all others first
    if (is_active) {
      await query('UPDATE breaking_news SET is_active = 0');
    }
    
    const placeholders = news_ids.map(() => '?').join(',');
    
    // Update selected news
    const result = await query(
      `UPDATE breaking_news SET is_active = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [is_active ? 1 : 0, ...news_ids]
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows} breaking news items ${is_active ? 'activated' : 'deactivated'}`,
      data: {
        affected_rows: result.affectedRows,
        is_active
      }
    });
    
  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update breaking news',
      message: error.message
    });
  }
});

// Bulk delete breaking news (Admin only)
router.delete('/bulk', auth, requireAdmin, async (req, res) => {
  try {
    const { news_ids } = req.body;
    
    if (!Array.isArray(news_ids) || news_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'news_ids must be a non-empty array'
      });
    }
    
    const placeholders = news_ids.map(() => '?').join(',');
    
    // Delete breaking news
    const result = await query(
      `DELETE FROM breaking_news WHERE id IN (${placeholders})`,
      news_ids
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows} breaking news items deleted successfully`,
      data: {
        affected_rows: result.affectedRows
      }
    });
    
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete breaking news',
      message: error.message
    });
  }
});

module.exports = router;