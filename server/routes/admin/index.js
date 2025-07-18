const express = require('express');
const db = require('../../config/database');

const router = express.Router();

// Import admin route modules
const usersRoutes = require('./users');
const categoriesRoutes = require('./categories');
const postsRoutes = require('./posts');
const settingsRoutes = require('./settings');
const lastNewsRoutes = require('./lastNews');

// Mount admin routes
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/posts', postsRoutes);
router.use('/settings', settingsRoutes);
router.use('/last-news', lastNewsRoutes);

// Admin dashboard stats endpoint
router.get('/dashboard/stats', async (req, res) => {
  try {
    
    // Get total counts
    const [postsCount] = await db.execute('SELECT COUNT(*) as total FROM posts');
    const [usersCount] = await db.execute('SELECT COUNT(*) as total FROM users');
    const [categoriesCount] = await db.execute('SELECT COUNT(*) as total FROM categories');
    
    // Get published posts count
    const [publishedPostsCount] = await db.execute('SELECT COUNT(*) as total FROM posts WHERE is_published = 1');
    
    // Get draft posts count
    const [draftPostsCount] = await db.execute('SELECT COUNT(*) as total FROM posts WHERE is_published = 0');
    
    // Get active users count
    const [activeUsersCount] = await db.execute('SELECT COUNT(*) as total FROM users WHERE is_active = 1');
    
    // Get recent posts (last 7 days)
    const [recentPostsCount] = await db.execute(
      'SELECT COUNT(*) as total FROM posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    
    // Get posts by status
    const [postsByStatus] = await db.execute(`
      SELECT 
        CASE WHEN is_published = 1 THEN 'published' ELSE 'draft' END as status,
        COUNT(*) as count
      FROM posts 
      GROUP BY is_published
    `);
    
    // Get posts by category
    const [postsByCategory] = await db.execute(`
      SELECT 
        c.name_ar as name,
        COUNT(p.id) as count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id
      GROUP BY c.id, c.name_ar
      ORDER BY count DESC
      LIMIT 10
    `);
    
    // Get recent activity (last 10 posts)
    const [recentPosts] = await db.execute(`
      SELECT 
        p.id,
        p.title_ar as title,
        CASE WHEN p.is_published = 1 THEN 'published' ELSE 'draft' END as status,
        p.created_at,
        u.username as author,
        c.name_ar as category
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        totals: {
          posts: postsCount[0].total,
          users: usersCount[0].total,
          categories: categoriesCount[0].total,
          published_posts: publishedPostsCount[0].total,
          draft_posts: draftPostsCount[0].total,
          active_users: activeUsersCount[0].total,
          recent_posts: recentPostsCount[0].total
        },
        charts: {
          posts_by_status: postsByStatus,
          posts_by_category: postsByCategory
        },
        recent_activity: recentPosts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

module.exports = router;