const express = require('express');
const { query, queryOne } = require('../db');
const { validate, categorySchema } = require('../middlewares/validation');
const { auth, requireAdmin, requireAdminOrEditor } = require('../middlewares/auth');

const router = express.Router();

// Enhanced Arabic slug generation for categories
const generateCategorySlug = (name, name_ar) => {
  const sourceName = name_ar || name;
  
  const arabicMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
    'ء': '', 'ئ': 'y', 'ؤ': 'w', 'لا': 'la'
  };
  
  const slug = sourceName.toLowerCase()
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (match) => arabicMap[match] || match)
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
    
  return slug || 'category';
};

// Get all categories with enhanced filtering - Public endpoint
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = (page - 1) * limit;
    
    const {
      search,
      language,
      include_post_count = 'true',
      include_empty = 'true',
      sort_by = 'sort_order',
      sort_order = 'asc'
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['sort_order', 'name', 'name_ar', 'created_at', 'post_count'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'sort_order';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'asc';
    
    let queryStr = `
      SELECT c.*`;
    
    if (include_post_count === 'true') {
      queryStr += `,
             (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) as post_count`;
    }
    
    queryStr += `
      FROM categories c
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (search) {
      queryStr += ' AND (c.name LIKE ? OR c.name_ar LIKE ? OR c.description LIKE ? OR c.description_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (language) {
      if (language === 'ar') {
        queryStr += ' AND (c.name_ar IS NOT NULL AND c.name_ar != "")';
      } else if (language === 'en') {
        queryStr += ' AND (c.name IS NOT NULL AND c.name != "")';
      }
    }
    
    // Handle empty categories filter
    if (include_empty === 'false') {
      queryStr += ' AND (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) > 0';
    }
    
    // Count total categories
    const countQuery = queryStr.replace(
      /SELECT c\.\*.*?FROM categories c/s,
      'SELECT COUNT(*) as total FROM categories c'
    );
    
    const totalResult = await query(countQuery, params);
    const total = totalResult[0].total;
    
    // Add ordering
    if (finalSortBy === 'post_count' && include_post_count === 'true') {
      queryStr += ` ORDER BY post_count ${finalSortOrder.toUpperCase()}`;
    } else {
      queryStr += ` ORDER BY c.${finalSortBy} ${finalSortOrder.toUpperCase()}`;
    }
    
    // Add pagination
    queryStr += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const categories = await query(queryStr, params);
    
    // Process categories
    const processedCategories = categories.map(category => ({
      ...category,
      post_count: include_post_count === 'true' ? (category.post_count || 0) : undefined,
      url: `/category/${category.slug}`
    }));
    
    res.json({
      success: true,
      data: {
        categories: processedCategories,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          search,
          language,
          include_post_count,
          include_empty,
          sort_by: finalSortBy,
          sort_order: finalSortOrder
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// Get single category by slug with posts - Public endpoint
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      include_posts = 'true',
      posts_page = 1,
      posts_limit = 10,
      posts_sort = 'created_at',
      posts_order = 'desc'
    } = req.query;
    
    // Get category
    const category = await queryOne(
      `SELECT c.*,
              (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) as post_count
       FROM categories c
       WHERE c.slug = ?`,
      [slug]
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }
    
    let posts = [];
    let postsPagination = null;
    
    // Get posts if requested
    if (include_posts === 'true') {
      const postsPageNum = parseInt(posts_page, 10) || 1;
      const postsLimitNum = Math.min(parseInt(posts_limit, 10) || 10, 50);
      const postsOffset = (postsPageNum - 1) * postsLimitNum;
      
      // Valid sort fields for posts
      const validPostsSortFields = ['created_at', 'updated_at', 'title', 'views'];
      const validPostsOrders = ['asc', 'desc'];
      
      const finalPostsSort = validPostsSortFields.includes(posts_sort) ? posts_sort : 'created_at';
      const finalPostsOrder = validPostsOrders.includes(posts_order) ? posts_order : 'desc';
      
      // Get posts
      posts = await query(
        `SELECT p.id, p.title, p.title_ar, p.excerpt, p.excerpt_ar, p.slug,
                p.featured_image, p.views, p.reading_time, p.created_at, p.is_featured,
                u.username as author_name, u.display_name as author_display_name
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         WHERE p.category_id = ? AND p.is_published = 1
         ORDER BY p.${finalPostsSort} ${finalPostsOrder.toUpperCase()}
         LIMIT ? OFFSET ?`,
        [category.id, postsLimitNum, postsOffset]
      );
      
      // Process posts
      posts = posts.map(post => ({
        ...post,
        is_featured: Boolean(post.is_featured),
        url: `/post/${post.id}/${post.slug}`
      }));
      
      postsPagination = {
        page: postsPageNum,
        limit: postsLimitNum,
        total: category.post_count,
        pages: Math.ceil(category.post_count / postsLimitNum)
      };
    }
    
    const response = {
      success: true,
      data: {
        ...category,
        url: `/category/${category.slug}`
      }
    };
    
    if (include_posts === 'true') {
      response.data.posts = posts;
      response.data.posts_pagination = postsPagination;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
      message: error.message
    });
  }
});

// Create new category (Admin only)
router.post('/', auth, requireAdmin, validate(categorySchema), async (req, res) => {
  try {
    const {
      name_ar,
      description_ar = '',
      color = '#007bff',
      sort_order = 0
    } = req.body;
    
    // Validate required fields
    if (!name_ar) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'name_ar is required'
      });
    }
    
    // Generate slug
    const baseSlug = generateCategorySlug(null, name_ar);
    let slug = baseSlug;
    
    // Ensure slug uniqueness
    const existingSlugs = await query('SELECT slug FROM categories WHERE slug LIKE ?', [`${baseSlug}%`]);
    const slugSet = new Set(existingSlugs.map(row => row.slug));
    
    let finalSlug = slug;
    let slugCounter = 1;
    while (slugSet.has(finalSlug)) {
      finalSlug = `${baseSlug}-${slugCounter}`;
      slugCounter += 1;
    }
    slug = finalSlug;
    
    // Insert category
    const result = await query(
      `INSERT INTO categories (
        name_ar, description_ar, slug, color, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name_ar, description_ar, slug, color, sort_order]
    );
    
    const categoryId = result.insertId;
    
    // Fetch created category
    const createdCategory = await queryOne(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        ...createdCategory,
        url: `/category/${createdCategory.slug}`
      }
    });
    
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category',
      message: error.message
    });
  }
});

// Update category (Admin only)
router.put('/:id', auth, requireAdmin, validate(categorySchema), async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    // Check if category exists
    const existingCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }
    
    const {
      name_ar,
      description_ar,
      color,
      sort_order
    } = req.body;
    
    // Handle slug regeneration if name changed
    let slug = existingCategory.slug;
    if (name_ar && name_ar !== existingCategory.name_ar) {
      const baseSlug = generateCategorySlug(null, name_ar || existingCategory.name_ar);
      slug = baseSlug;
      
      // Ensure slug uniqueness (excluding current category)
      const existingSlugs = await query('SELECT slug FROM categories WHERE slug LIKE ? AND id != ?', [`${baseSlug}%`, categoryId]);
      const slugSet = new Set(existingSlugs.map(row => row.slug));
      
      let finalSlug = slug;
      let slugCounter = 1;
      while (slugSet.has(finalSlug)) {
        finalSlug = `${baseSlug}-${slugCounter}`;
        slugCounter += 1;
      }
      slug = finalSlug;
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (name_ar !== undefined) {
      updateFields.push('name_ar = ?');
      updateValues.push(name_ar);
    }
    if (description_ar !== undefined) {
      updateFields.push('description_ar = ?');
      updateValues.push(description_ar);
    }
    if (color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(color);
    }
    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(sort_order);
    }
    
    // Always update these fields
    updateFields.push('slug = ?', 'updated_at = NOW()');
    updateValues.push(slug);
    
    // Add category ID for WHERE clause
    updateValues.push(categoryId);
    
    // Execute update
    await query(
      `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated category
    const updatedCategory = await queryOne(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        ...updatedCategory,
        url: `/category/${updatedCategory.slug}`
      }
    });
    
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
      message: error.message
    });
  }
});

// Delete category (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    // Check if category exists
    const category = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }
    
    // Check if category has posts
    const postCount = await queryOne(
      'SELECT COUNT(*) as count FROM posts WHERE category_id = ?',
      [categoryId]
    );
    
    if (postCount.count > 0) {
      return res.status(409).json({
        success: false,
        error: 'Category has posts',
        message: `Cannot delete category. It contains ${postCount.count} posts. Please move or delete the posts first.`
      });
    }
    
    // Delete category
    await query('DELETE FROM categories WHERE id = ?', [categoryId]);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category',
      message: error.message
    });
  }
});

// Get category statistics (Admin/Editor only)
router.get('/:id/stats', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    // Check if category exists
    const category = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }
    
    // Get detailed statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_posts,
        SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as draft_posts,
        SUM(CASE WHEN is_featured = 1 AND is_published = 1 THEN 1 ELSE 0 END) as featured_posts,
        SUM(views) as total_views,
        AVG(views) as avg_views,
        MAX(views) as max_views,
        AVG(reading_time) as avg_reading_time,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as recent_posts
      FROM posts 
      WHERE category_id = ?
    `, [categoryId]);
    
    // Get top posts in this category
    const topPosts = await query(`
      SELECT id, title, title_ar, slug, views, is_featured, created_at
      FROM posts 
      WHERE category_id = ? AND is_published = 1
      ORDER BY views DESC 
      LIMIT 5
    `, [categoryId]);
    
    res.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          name_ar: category.name_ar,
          slug: category.slug
        },
        statistics: stats[0],
        top_posts: topPosts.map(post => ({
          ...post,
          is_featured: Boolean(post.is_featured),
          url: `/post/${post.id}/${post.slug}`
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category statistics',
      message: error.message
    });
  }
});

// Get categories overview/statistics (Admin/Editor only)
router.get('/stats/overview', auth, requireAdminOrEditor, async (req, res) => {
  try {
    // Get overall statistics
    const overallStats = await query(`
      SELECT 
        COUNT(*) as total_categories,
        COUNT(CASE WHEN (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) > 0 THEN 1 END) as categories_with_posts,
        AVG((SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1)) as avg_posts_per_category
      FROM categories c
    `);
    
    // Get top categories by post count
    const topCategories = await query(`
      SELECT c.id, c.name, c.name_ar, c.slug,
             COUNT(p.id) as post_count,
             SUM(p.views) as total_views
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      GROUP BY c.id, c.name, c.name_ar, c.slug
      ORDER BY post_count DESC, total_views DESC
      LIMIT 10
    `);
    
    // Get recent activity
    const recentActivity = await query(`
      SELECT c.id, c.name, c.name_ar, c.slug,
             COUNT(p.id) as recent_posts
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY c.id, c.name, c.name_ar, c.slug
      HAVING recent_posts > 0
      ORDER BY recent_posts DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        summary: overallStats[0],
        top_categories: topCategories.map(cat => ({
          ...cat,
          url: `/category/${cat.slug}`
        })),
        recent_activity: recentActivity.map(cat => ({
          ...cat,
          url: `/category/${cat.slug}`
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching categories overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories overview',
      message: error.message
    });
  }
});

// Bulk delete categories (Admin only)
router.delete('/bulk', auth, requireAdmin, async (req, res) => {
  try {
    const { category_ids } = req.body;
    
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'category_ids must be a non-empty array'
      });
    }
    
    // Check if any categories have posts
    const placeholders = category_ids.map(() => '?').join(',');
    const categoriesWithPosts = await query(
      `SELECT c.id, c.name, c.name_ar, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id
       WHERE c.id IN (${placeholders})
       GROUP BY c.id, c.name, c.name_ar
       HAVING post_count > 0`,
      category_ids
    );
    
    if (categoriesWithPosts.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Categories have posts',
        message: 'Cannot delete categories that contain posts',
        data: {
          categories_with_posts: categoriesWithPosts
        }
      });
    }
    
    // Delete categories
    const result = await query(
      `DELETE FROM categories WHERE id IN (${placeholders})`,
      category_ids
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows} categories deleted successfully`,
      data: {
        affected_rows: result.affectedRows
      }
    });
    
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete categories',
      message: error.message
    });
  }
});

// Update categories sort order (Admin only)
router.patch('/reorder', auth, requireAdmin, async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'categories must be a non-empty array with id and sort_order fields'
      });
    }
    
    // Validate each category object
    const invalidCategory = categories.find(cat => !cat.id || typeof cat.sort_order !== 'number');
    if (invalidCategory) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Each category must have id and sort_order fields'
      });
    }
    
    // Update sort orders
    await Promise.all(categories.map(cat => 
      query(
        'UPDATE categories SET sort_order = ?, updated_at = NOW() WHERE id = ?',
        [cat.sort_order, cat.id]
      )
    ));
    
    
    res.json({
      success: true,
      message: 'Categories reordered successfully',
      data: {
        updated_count: categories.length
      }
    });
    
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder categories',
      message: error.message
    });
  }
});

module.exports = router;