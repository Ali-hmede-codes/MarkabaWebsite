const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { query, queryOne } = require('../db');
// const { validate, postSchema } = require('../middlewares/validation'); // Commented out as not used
const { auth, requireAuthorOrEditor, canEditContent, requireAdminOrEditor } = require('../middlewares/auth');
const { generateArabicSlug, calculateReadingTime } = require('../utils/postUtils');

const router = express.Router();

// Helper function to generate unique slug
async function generateUniqueSlug(title, postId = null) {
  const baseSlug = generateArabicSlug(title);
  let slug = baseSlug;
  let counter = 1;
  
  const existingSlugs = new Set();
  let checkQuery = 'SELECT slug FROM posts WHERE slug LIKE ?';
  const checkParams = [`${baseSlug}%`];
  
  if (postId) {
    checkQuery += ' AND id != ?';
    checkParams.push(postId);
  }
  
  const existingPosts = await query(checkQuery, checkParams);
  existingPosts.forEach(post => existingSlugs.add(post.slug));
  
  while (existingSlugs.has(slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}

// Helper function to create JSON export files
async function createPostExportFiles(posts) {
  try {
    const exportDir = path.join(__dirname, '../../client/data');
    
    // Ensure export directory exists
    try {
      await fs.access(exportDir);
    } catch (error) {
      await fs.mkdir(exportDir, { recursive: true });
    }
    
    // Create posts.json file
    const postsData = {
      posts: posts.map(post => ({
        id: post.id,
        title_ar: post.title_ar,
        content_ar: post.content_ar,
        excerpt_ar: post.excerpt_ar,
        slug: post.slug,
        category_id: post.category_id,
        category_name: post.category_name,
        category_slug: post.category_slug,
        author_id: post.author_id,
        author_name: post.author_name,
        author_display_name: post.author_display_name,
        featured_image: post.featured_image,
        is_featured: Boolean(post.is_featured),
        is_published: Boolean(post.is_published),
        views: post.views,
        reading_time: post.reading_time,
        tags: post.tags ? JSON.parse(post.tags) : [],
        meta_description_ar: post.meta_description_ar,
        meta_keywords_ar: post.meta_keywords_ar,
        created_at: post.created_at,
        updated_at: post.updated_at
      })),
      generated_at: new Date().toISOString(),
      total_count: posts.length
    };
    
    await fs.writeFile(
      path.join(exportDir, 'posts.json'),
      JSON.stringify(postsData, null, 2),
      'utf8'
    );
    
    console.log('Posts JSON export created successfully');
    return true;
  } catch (error) {
    console.error('Failed to create posts JSON export:', error);
    return false;
  }
}

// GET / - Get all posts with advanced filtering (Public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = (page - 1) * limit;
    
    const {
      status = 'published',
      category,
      author,
      featured,
      search,
      tags,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc',
      min_reading_time,
      max_reading_time,
      min_views,
      max_views,
      export_json
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['created_at', 'updated_at', 'title_ar', 'views', 'reading_time'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';

    let baseQuery = `
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (status && status !== 'all') {
      if (status === 'published') {
        baseQuery += ' AND p.is_published = 1';
      } else if (status === 'draft') {
        baseQuery += ' AND p.is_published = 0';
      }
    }
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        baseQuery += ' AND c.slug = ?';
        params.push(category);
      } else {
        baseQuery += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }
    
    if (author) {
      if (Number.isNaN(Number(author))) {
        baseQuery += ' AND u.username = ?';
        params.push(author);
      } else {
        baseQuery += ' AND p.author_id = ?';
        params.push(parseInt(author, 10));
      }
    }
    
    if (featured !== undefined) {
      baseQuery += ' AND p.is_featured = ?';
      params.push(featured === 'true' || featured === '1' ? 1 : 0);
    }
    
    if (search) {
      baseQuery += ' AND (p.title_ar LIKE ? OR p.content_ar LIKE ? OR p.excerpt_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (tags) {
      let tagArray = [];
      if (Array.isArray(tags)) {
        tagArray = tags.filter(tag => tag && tag.trim() !== '');
      } else if (typeof tags === 'string' && tags.trim() !== '') {
        tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }
      if (tagArray.length > 0) {
        const tagConditions = tagArray.map(() => 'JSON_CONTAINS(p.tags, ?)');
        baseQuery += ` AND (${tagConditions.join(' OR ')})`;
        tagArray.forEach(tag => params.push(`"${tag}"`));
      }
    }
    
    if (date_from) {
      baseQuery += ' AND DATE(p.created_at) >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      baseQuery += ' AND DATE(p.created_at) <= ?';
      params.push(date_to);
    }
    
    if (min_reading_time) {
      baseQuery += ' AND p.reading_time >= ?';
      params.push(parseInt(min_reading_time, 10));
    }
    
    if (max_reading_time) {
      baseQuery += ' AND p.reading_time <= ?';
      params.push(parseInt(max_reading_time, 10));
    }
    
    if (min_views) {
      baseQuery += ' AND p.views >= ?';
      params.push(parseInt(min_views, 10));
    }
    
    if (max_views) {
      baseQuery += ' AND p.views <= ?';
      params.push(parseInt(max_views, 10));
    }
    
    // Get total count
    const countQuery = baseQuery.replace(
      'SELECT p.*, c.name_ar as category_name, c.slug as category_slug, u.username as author_name, u.display_name as author_display_name',
      'SELECT COUNT(*) as total'
    );
    
    const totalResult = await query(countQuery, params);
    const total = totalResult[0].total;
    
    // Get posts with pagination
    const postsQuery = `${baseQuery} ORDER BY p.${finalSortBy} ${finalSortOrder.toUpperCase()} LIMIT ? OFFSET ?`;
    const postsParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    
    const posts = await query(postsQuery, postsParams);
    
    // Process posts
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published)
    }));
    
    // Create JSON export if requested
    if (export_json === 'true') {
      await createPostExportFiles(processedPosts);
    }
    
    res.json({
      success: true,
      data: {
        posts: processedPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          status,
          category,
          author,
          featured,
          search,
          tags,
          date_from,
          date_to,
          sort_by: finalSortBy,
          sort_order: finalSortOrder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      message: error.message
    });
  }
});

// GET /featured - Get featured posts (Public)
router.get('/featured', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const { category } = req.query;
    
    let queryStr = `
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.is_published = 1 AND p.is_featured = 1
    `;
    
    const params = [];
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        queryStr += ' AND c.slug = ?';
        params.push(category);
      } else {
        queryStr += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }
    
    queryStr += ' ORDER BY p.created_at DESC LIMIT ?';
    params.push(limit);
    
    const posts = await query(queryStr, params);
    
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published)
    }));
    
    res.json({
      success: true,
      data: processedPosts
    });
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured posts',
      message: error.message
    });
  }
});

// GET /latest - Get latest posts (Public)
router.get('/latest', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const { category } = req.query;
    
    let queryStr = `
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.is_published = 1
    `;
    
    const params = [];
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        queryStr += ' AND c.slug = ?';
        params.push(category);
      } else {
        queryStr += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }
    
    queryStr += ' ORDER BY p.created_at DESC LIMIT ?';
    params.push(limit);
    
    const posts = await query(queryStr, params);
    
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published)
    }));
    
    res.json({
      success: true,
      data: processedPosts
    });
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest posts',
      message: error.message
    });
  }
});

// GET /popular - Get popular posts by views (Public)
router.get('/popular', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const { category, timeframe = 'all' } = req.query;
    
    let queryStr = `
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.is_published = 1
    `;
    
    const params = [];
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        queryStr += ' AND c.slug = ?';
        params.push(category);
      } else {
        queryStr += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }
    
    // Add timeframe filter
    if (timeframe === 'week') {
      queryStr += ' AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    } else if (timeframe === 'month') {
      queryStr += ' AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    } else if (timeframe === 'year') {
      queryStr += ' AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    }
    
    queryStr += ' ORDER BY p.views DESC, p.created_at DESC LIMIT ?';
    params.push(limit);
    
    const posts = await query(queryStr, params);
    
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published)
    }));
    
    res.json({
      success: true,
      data: processedPosts
    });
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular posts',
      message: error.message
    });
  }
});

// GET /export - Export all posts as JSON (Admin/Editor only)
router.get('/export', requireAdminOrEditor, async (req, res) => {
  try {
    const posts = await query(`
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published)
    }));
    
    // Create JSON export file
    await createPostExportFiles(processedPosts);
    
    res.json({
      success: true,
      message: 'Posts exported successfully',
      data: {
        total_posts: processedPosts.length,
        export_path: '/client/data/posts.json',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error exporting posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export posts',
      message: error.message
    });
  }
});

// GET /:id - Get single post by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(postId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID'
      });
    }
    
    const post = await queryOne(`
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Increment views for published posts
    if (post.is_published) {
      await query('UPDATE posts SET views = views + 1 WHERE id = ?', [postId]);
      post.views = (post.views || 0) + 1;
    }
    
    const processedPost = {
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published)
    };
    
    res.json({
      success: true,
      data: processedPost
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post',
      message: error.message
    });
  }
});

// GET /slug/:slug - Get single post by slug (Public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const post = await queryOne(`
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
    `, [slug]);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Increment views for published posts
    if (post.is_published) {
      await query('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);
      post.views = (post.views || 0) + 1;
    }
    
    const processedPost = {
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published)
    };
    
    res.json({
      success: true,
      data: processedPost
    });
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post',
      message: error.message
    });
  }
});

// POST / - Create new post (Author/Editor/Admin)
router.post('/', auth, requireAuthorOrEditor, async (req, res) => {
  try {
    const {
      title_ar,
      content_ar,
      excerpt_ar,
      category_id,
      featured_image,
      is_featured = false,
      is_published = false,
      tags = [],
      meta_description_ar,
      meta_keywords_ar
    } = req.body;
    
    // Validate required fields
    if (!title_ar || !content_ar) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }
    
    // Generate unique slug
    const slug = await generateUniqueSlug(title_ar);
    
    // Calculate reading time
    const reading_time = calculateReadingTime(content_ar);
    
    // Prepare tags as JSON
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
    
    const result = await query(`
      INSERT INTO posts (
        title_ar, content_ar, excerpt_ar, slug, category_id, author_id,
        featured_image, is_featured, is_published, reading_time, tags,
        meta_description_ar, meta_keywords_ar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title_ar,
      content_ar,
      excerpt_ar,
      slug,
      category_id,
      req.user.id,
      featured_image,
      is_featured ? 1 : 0,
      is_published ? 1 : 0,
      reading_time,
      tagsJson,
      meta_description_ar,
      meta_keywords_ar
    ]);
    
    const newPost = await queryOne(`
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [result.insertId]);
    
    const processedPost = {
      ...newPost,
      tags: newPost.tags ? JSON.parse(newPost.tags) : [],
      is_featured: Boolean(newPost.is_featured),
      is_published: Boolean(newPost.is_published)
    };
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: processedPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
      message: error.message
    });
  }
});

// PUT /:id - Update post (Author/Editor/Admin)
router.put('/:id', auth, canEditContent, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(postId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID'
      });
    }
    
    const existingPost = await queryOne('SELECT * FROM posts WHERE id = ?', [postId]);
    
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    const {
      title_ar,
      content_ar,
      excerpt_ar,
      category_id,
      featured_image,
      is_featured,
      is_published,
      tags,
      meta_description_ar,
      meta_keywords_ar
    } = req.body;
    
    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title_ar && title_ar !== existingPost.title_ar) {
      slug = await generateUniqueSlug(title_ar, postId);
    }
    
    // Calculate reading time if content changed
    let reading_time = existingPost.reading_time;
    if (content_ar && content_ar !== existingPost.content_ar) {
      reading_time = calculateReadingTime(content_ar);
    }
    
    // Prepare tags as JSON
    const tagsJson = tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : existingPost.tags;
    



    // Handle boolean values for database
    let featuredValue = null;
    if (is_featured !== undefined) {
      featuredValue = is_featured ? 1 : 0;
    }
    
    let publishedValue = null;
    if (is_published !== undefined) {
      publishedValue = is_published ? 1 : 0;
    }
    
    await query(`
      UPDATE posts SET
        title_ar = COALESCE(?, title_ar),
        content_ar = COALESCE(?, content_ar),
        excerpt_ar = COALESCE(?, excerpt_ar),
        slug = ?,
        category_id = COALESCE(?, category_id),
        featured_image = COALESCE(?, featured_image),
        is_featured = COALESCE(?, is_featured),
        is_published = COALESCE(?, is_published),
        reading_time = ?,
        tags = ?,
        meta_description_ar = COALESCE(?, meta_description_ar),
        meta_keywords_ar = COALESCE(?, meta_keywords_ar),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title_ar,
      content_ar,
      excerpt_ar,
      slug,
      category_id,
      featured_image,
      featuredValue,
      publishedValue,
      reading_time,
      tagsJson,
      meta_description_ar,
      meta_keywords_ar,
      postId
    ]);
    
    const updatedPost = await queryOne(`
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, 
             u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]);
    
    const processedPost = {
      ...updatedPost,
      tags: updatedPost.tags ? JSON.parse(updatedPost.tags) : [],
      is_featured: Boolean(updatedPost.is_featured),
      is_published: Boolean(updatedPost.is_published)
    };
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      data: processedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post',
      message: error.message
    });
  }
});

// DELETE /:id - Delete post (Author/Editor/Admin)
router.delete('/:id', auth, canEditContent, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(postId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID'
      });
    }
    
    const existingPost = await queryOne('SELECT * FROM posts WHERE id = ?', [postId]);
    
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    await query('DELETE FROM posts WHERE id = ?', [postId]);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
      message: error.message
    });
  }
});

// POST /bulk-delete - Delete multiple posts (Admin/Editor only)
router.post('/bulk-delete', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const { post_ids } = req.body;
    
    if (!Array.isArray(post_ids) || post_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Post IDs array is required'
      });
    }
    
    // Validate all IDs are numbers
    const validIds = post_ids.filter(id => !Number.isNaN(parseInt(id, 10)));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid post IDs provided'
      });
    }
    
    const placeholders = validIds.map(() => '?').join(',');
    const result = await query(`DELETE FROM posts WHERE id IN (${placeholders})`, validIds);
    
    res.json({
      success: true,
      message: `${result.affectedRows} posts deleted successfully`,
      deleted_count: result.affectedRows
    });
  } catch (error) {
    console.error('Error bulk deleting posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete posts',
      message: error.message
    });
  }
});

// GET /stats/overview - Get posts statistics (Admin/Editor only)
router.get('/stats/overview', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_posts,
        SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as draft_posts,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_posts,
        SUM(views) as total_views,
        AVG(views) as avg_views,
        AVG(reading_time) as avg_reading_time
      FROM posts
    `);
    
    const categoryStats = await query(`
      SELECT 
        c.name_ar as category_name,
        c.slug as category_slug,
        COUNT(p.id) as post_count,
        SUM(p.views) as total_views
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id
      GROUP BY c.id, c.name_ar, c.slug
      ORDER BY post_count DESC
    `);
    
    const authorStats = await query(`
      SELECT 
        u.username,
        u.display_name,
        COUNT(p.id) as post_count,
        SUM(p.views) as total_views
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      WHERE u.role IN ('author', 'editor', 'admin')
      GROUP BY u.id, u.username, u.display_name
      ORDER BY post_count DESC
    `);
    
    res.json({
      success: true,
      data: {
        overview: stats[0],
        by_category: categoryStats,
        by_author: authorStats
      }
    });
  } catch (error) {
    console.error('Error fetching posts statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;