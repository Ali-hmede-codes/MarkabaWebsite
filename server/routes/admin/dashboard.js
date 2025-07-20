const express = require('express');
const { query } = require('../../db');
const { auth, requireAdmin } = require('../../middlewares/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const [posts] = await query('SELECT COUNT(*) as count FROM posts');
    const [categories] = await query('SELECT COUNT(*) as count FROM categories');
    const [users] = await query('SELECT COUNT(*) as count FROM users');
    const [published] = await query('SELECT COUNT(*) as count FROM posts WHERE status = "published"');
    const [drafts] = await query('SELECT COUNT(*) as count FROM posts WHERE status = "draft"');
    const [featured] = await query('SELECT COUNT(*) as count FROM posts WHERE is_featured = 1');
    const [views] = await query('SELECT SUM(views) as total FROM posts');
    const [activeUsers] = await query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const [recentPosts] = await query('SELECT COUNT(*) as count FROM posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    const recentActivity = await query(
      'SELECT id, title_ar as title, status, created_at, (SELECT username FROM users WHERE id = posts.author_id) as author, (SELECT name_ar FROM categories WHERE id = posts.category_id) as category FROM posts ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: {
        totals: {
          posts: posts.count,
          categories: categories.count,
          users: users.count,
          published_posts: published.count,
          draft_posts: drafts.count,
          featured_posts: featured.count,
          total_views: views.total || 0,
          active_users: activeUsers.count,
          recent_posts: recentPosts.count
        },
        recent_activity: recentActivity
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;