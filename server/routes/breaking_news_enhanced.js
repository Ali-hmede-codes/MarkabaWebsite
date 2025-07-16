const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { query, queryOne } = require('../db');
const { auth, requireAdminOrEditor } = require('../middlewares/auth');

const router = express.Router();

// Helper function to create JSON export files
async function createBreakingNewsExportFiles(breakingNews) {
  try {
    const exportDir = path.join(__dirname, '../../client/data');
    
    // Ensure export directory exists
    try {
      await fs.access(exportDir);
    } catch (error) {
      await fs.mkdir(exportDir, { recursive: true });
    }
    
    // Create breaking_news.json file
    const breakingNewsData = {
      breaking_news: breakingNews.map(news => ({
        id: news.id,
        title_ar: news.title_ar,
        content_ar: news.content_ar,
        priority: news.priority,
        is_active: Boolean(news.is_active),
        expires_at: news.expires_at,
        created_at: news.created_at,
        updated_at: news.updated_at
      })),
      generated_at: new Date().toISOString(),
      total_count: breakingNews.length
    };
    
    await fs.writeFile(
      path.join(exportDir, 'breaking_news.json'),
      JSON.stringify(breakingNewsData, null, 2),
      'utf8'
    );
    
    console.log('Breaking news JSON export created successfully');
    return true;
  } catch (error) {
    console.error('Failed to create breaking news JSON export:', error);
    return false;
  }
}

// GET / - Get all breaking news (Public)
router.get('/', async (req, res) => {
  try {
    const {
      include_inactive = 'false',
      include_expired = 'false',
      priority,
      limit = 10,
      sort_by = 'priority',
      sort_order = 'desc',
      export_json
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['priority', 'created_at', 'expires_at', 'title_ar'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'priority';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';
    const finalLimit = Math.min(parseInt(limit, 10) || 10, 100);

    let baseQuery = 'SELECT * FROM breaking_news WHERE 1=1';
    const params = [];
    
    // Apply filters
    if (include_inactive !== 'true') {
      baseQuery += ' AND is_active = 1';
    }
    
    if (include_expired !== 'true') {
      baseQuery += ' AND (expires_at IS NULL OR expires_at > NOW())';
    }
    
    if (priority !== undefined && !Number.isNaN(parseInt(priority, 10))) {
      baseQuery += ' AND priority = ?';
      params.push(parseInt(priority, 10));
    }
    
    baseQuery += ` ORDER BY ${finalSortBy} ${finalSortOrder.toUpperCase()}`;
    
    if (finalLimit > 0) {
      baseQuery += ' LIMIT ?';
      params.push(finalLimit);
    }
    
    const breakingNews = await query(baseQuery, params);
    
    // Process breaking news
    const processedBreakingNews = breakingNews.map(news => ({
      ...news,
      is_active: Boolean(news.is_active),
      is_expired: news.expires_at ? new Date(news.expires_at) < new Date() : false
    }));
    
    // Create JSON export if requested
    if (export_json === 'true') {
      await createBreakingNewsExportFiles(processedBreakingNews);
    }
    
    res.json({
      success: true,
      data: processedBreakingNews,
      filters: {
        include_inactive,
        include_expired,
        priority,
        limit: finalLimit,
        sort_by: finalSortBy,
        sort_order: finalSortOrder
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

// GET /active - Get only active and non-expired breaking news (Public)
router.get('/active', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const { priority } = req.query;
    
    let queryStr = `
      SELECT * FROM breaking_news 
      WHERE is_active = 1 
      AND (expires_at IS NULL OR expires_at > NOW())
    `;
    
    const params = [];
    
    if (priority !== undefined && !Number.isNaN(parseInt(priority, 10))) {
      queryStr += ' AND priority = ?';
      params.push(parseInt(priority, 10));
    }
    
    queryStr += ' ORDER BY priority DESC, created_at DESC LIMIT ?';
    params.push(limit);
    
    const breakingNews = await query(queryStr, params);
    
    const processedBreakingNews = breakingNews.map(news => ({
      ...news,
      is_active: Boolean(news.is_active),
      is_expired: false // All results are non-expired by query
    }));
    
    res.json({
      success: true,
      data: processedBreakingNews
    });
  } catch (error) {
    console.error('Error fetching active breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active breaking news',
      message: error.message
    });
  }
});

// GET /export - Export all breaking news as JSON (Admin/Editor only)
router.get('/export', requireAdminOrEditor, async (req, res) => {
  try {
    const breakingNews = await query(`
      SELECT * FROM breaking_news 
      ORDER BY priority DESC, created_at DESC
    `);
    
    const processedBreakingNews = breakingNews.map(news => ({
      ...news,
      is_active: Boolean(news.is_active),
      is_expired: news.expires_at ? new Date(news.expires_at) < new Date() : false
    }));
    
    // Create JSON export file
    await createBreakingNewsExportFiles(processedBreakingNews);
    
    res.json({
      success: true,
      message: 'Breaking news exported successfully',
      data: {
        total_breaking_news: processedBreakingNews.length,
        export_path: '/client/data/breaking_news.json',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error exporting breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export breaking news',
      message: error.message
    });
  }
});

// GET /:id - Get single breaking news by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(newsId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid breaking news ID'
      });
    }
    
    const news = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [newsId]);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'Breaking news not found'
      });
    }
    
    const processedNews = {
      ...news,
      is_active: Boolean(news.is_active),
      is_expired: news.expires_at ? new Date(news.expires_at) < new Date() : false
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

// POST / - Create new breaking news (Admin/Editor only)
router.post('/', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const {
      title_ar,
      content_ar,
      priority = 1,
      is_active = true,
      expires_at
    } = req.body;
    
    // Validate required fields
    if (!title_ar || !content_ar) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }
    
    // Validate priority
    const finalPriority = Math.max(1, Math.min(parseInt(priority, 10) || 1, 10));
    
    // Validate expires_at
    let finalExpiresAt = null;
    if (expires_at) {
      const expiryDate = new Date(expires_at);
      if (!Number.isNaN(expiryDate.getTime()) && expiryDate > new Date()) {
        finalExpiresAt = expires_at;
      }
    }
    
    const result = await query(`
      INSERT INTO breaking_news (
        title_ar, content_ar, priority, is_active, expires_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      title_ar,
      content_ar,
      finalPriority,
      is_active ? 1 : 0,
      finalExpiresAt
    ]);
    
    const newNews = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [result.insertId]);
    
    const processedNews = {
      ...newNews,
      is_active: Boolean(newNews.is_active),
      is_expired: newNews.expires_at ? new Date(newNews.expires_at) < new Date() : false
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

// PUT /:id - Update breaking news (Admin/Editor only)
router.put('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(newsId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid breaking news ID'
      });
    }
    
    const existingNews = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [newsId]);
    
    if (!existingNews) {
      return res.status(404).json({
        success: false,
        error: 'Breaking news not found'
      });
    }
    
    const {
      title_ar,
      content_ar,
      priority,
      is_active,
      expires_at
    } = req.body;
    
    // Validate priority if provided
    let finalPriority = null;
    if (priority !== undefined) {
      finalPriority = Math.max(1, Math.min(parseInt(priority, 10) || 1, 10));
    }
    
    // Validate expires_at if provided
    let finalExpiresAt = existingNews.expires_at;
    if (expires_at !== undefined) {
      if (expires_at === null || expires_at === '') {
        finalExpiresAt = null;
      } else {
        const expiryDate = new Date(expires_at);
        if (!Number.isNaN(expiryDate.getTime())) {
          finalExpiresAt = expires_at;
        }
      }
    }
    
    // Handle boolean value for database
    let activeValue = null;
    if (is_active !== undefined) {
      activeValue = is_active ? 1 : 0;
    }
    
    await query(`
      UPDATE breaking_news SET
        title_ar = COALESCE(?, title_ar),
        content_ar = COALESCE(?, content_ar),
        priority = COALESCE(?, priority),
        is_active = COALESCE(?, is_active),
        expires_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title_ar,
      content_ar,
      finalPriority,
      activeValue,
      finalExpiresAt,
      newsId
    ]);
    
    const updatedNews = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [newsId]);
    
    const processedNews = {
      ...updatedNews,
      is_active: Boolean(updatedNews.is_active),
      is_expired: updatedNews.expires_at ? new Date(updatedNews.expires_at) < new Date() : false
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

// DELETE /:id - Delete breaking news (Admin/Editor only)
router.delete('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(newsId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid breaking news ID'
      });
    }
    
    const existingNews = await queryOne('SELECT * FROM breaking_news WHERE id = ?', [newsId]);
    
    if (!existingNews) {
      return res.status(404).json({
        success: false,
        error: 'Breaking news not found'
      });
    }
    
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

// POST /bulk-delete - Delete multiple breaking news (Admin/Editor only)
router.post('/bulk-delete', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const { news_ids } = req.body;
    
    if (!Array.isArray(news_ids) || news_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'News IDs array is required'
      });
    }
    
    // Validate all IDs are numbers
    const validIds = news_ids.filter(id => !Number.isNaN(parseInt(id, 10)));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid news IDs provided'
      });
    }
    
    const placeholders = validIds.map(() => '?').join(',');
    const result = await query(`DELETE FROM breaking_news WHERE id IN (${placeholders})`, validIds);
    
    res.json({
      success: true,
      message: `${result.affectedRows} breaking news deleted successfully`,
      deleted_count: result.affectedRows
    });
  } catch (error) {
    console.error('Error bulk deleting breaking news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete breaking news',
      message: error.message
    });
  }
});

// GET /stats/overview - Get breaking news statistics (Admin/Editor only)
router.get('/stats/overview', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_breaking_news,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_breaking_news,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_breaking_news,
        SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 ELSE 0 END) as expired_breaking_news,
        SUM(CASE WHEN expires_at IS NULL OR expires_at > NOW() THEN 1 ELSE 0 END) as current_breaking_news,
        AVG(priority) as avg_priority
      FROM breaking_news
    `);
    
    const priorityStats = await query(`
      SELECT 
        priority,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM breaking_news
      GROUP BY priority
      ORDER BY priority DESC
    `);
    
    res.json({
      success: true,
      data: {
        overview: stats[0],
        by_priority: priorityStats
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

module.exports = router;