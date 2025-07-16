const express = require('express');
const { query, queryOne } = require('../db');
// const { validate, categorySchema } = require('../middlewares/validation');
const { auth, requireAdmin, requireAdminOrEditor } = require('../middlewares/auth');

const router = express.Router();

// Enhanced Arabic slug generation for categories
const generateCategorySlug = (name_ar) => {
  if (!name_ar) return 'category';
  
  const arabicMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
    'ء': '', 'ئ': 'y', 'ؤ': 'w', 'لا': 'la'
  };
  
  const slug = name_ar.toLowerCase()
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, (match) => arabicMap[match] || match)
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
    
  return slug || 'category';
};

// GET /api/v2/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const includePostCount = req.query.include_post_count !== 'false';
    const includeEmpty = req.query.include_empty !== 'false';
    
    // Base query
    let baseQuery = `
      SELECT c.id, c.name_ar, c.slug, c.description_ar, c.color, c.sort_order, c.is_active, c.created_at, c.updated_at
    `;
    
    if (includePostCount) {
      baseQuery += `, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) as post_count`;
    }
    
    baseQuery += ` FROM categories c WHERE c.is_active = 1`;
    
    const params = [];
    
    // Add search filter
    if (search) {
      baseQuery += ` AND (c.name_ar LIKE ? OR c.description_ar LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Filter empty categories if requested
    if (!includeEmpty) {
      baseQuery += ` AND (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) > 0`;
    }
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM categories c WHERE c.is_active = 1`;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (c.name_ar LIKE ? OR c.description_ar LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (!includeEmpty) {
      countQuery += ` AND (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) > 0`;
    }
    
    const [totalResult, categories] = await Promise.all([
      query(countQuery, countParams),
      query(`${baseQuery} ORDER BY c.sort_order ASC, c.name_ar ASC LIMIT ? OFFSET ?`, [...params, parseInt(limit, 10), parseInt(offset, 10)])
    ]);
    
    const total = totalResult[0].total;
    
    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          ...cat,
          is_active: Boolean(cat.is_active),
          post_count: includePostCount ? (cat.post_count || 0) : undefined
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

// GET /api/v2/categories/:slug - Get single category by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const includePosts = req.query.include_posts !== 'false';
    const postsPage = parseInt(req.query.posts_page, 10) || 1;
    const postsLimit = Math.min(parseInt(req.query.posts_limit, 10) || 10, 50);
    const postsOffset = (postsPage - 1) * postsLimit;
    
    // Get category
    const category = await queryOne(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) as post_count
       FROM categories c 
       WHERE c.slug = ? AND c.is_active = 1`,
      [slug]
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const result = {
      ...category,
      is_active: Boolean(category.is_active)
    };
    
    // Get posts if requested
    if (includePosts) {
      const posts = await query(
        `SELECT p.id, p.title_ar, p.excerpt_ar, p.slug, p.featured_image, 
                p.views, p.reading_time, p.created_at, p.is_featured,
                u.username, u.display_name
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         WHERE p.category_id = ? AND p.is_published = 1
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [category.id, parseInt(postsLimit, 10), parseInt(postsOffset, 10)]
      );
      
      result.posts = posts.map(post => ({
        ...post,
        is_featured: Boolean(post.is_featured)
      }));
      
      result.posts_pagination = {
        page: postsPage,
        limit: postsLimit,
        total: category.post_count,
        pages: Math.ceil(category.post_count / postsLimit)
      };
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
      message: error.message
    });
  }
});

// POST /api/v2/categories - Create new category (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name_ar, description_ar = '', color = '#007bff', sort_order = 0 } = req.body;
    
    if (!name_ar || name_ar.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'name_ar is required'
      });
    }
    
    // Generate unique slug
    const baseSlug = generateCategorySlug(name_ar);
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and generate unique one
    const existingSlugs = await query('SELECT slug FROM categories WHERE slug LIKE ?', [`${baseSlug}%`]);
    const slugSet = new Set(existingSlugs.map(row => row.slug));
    
    while (slugSet.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    
    // Insert category
    const result = await query(
      `INSERT INTO categories (name_ar, description_ar, slug, color, sort_order, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name_ar.trim(), description_ar.trim(), slug, color, sort_order]
    );
    
    // Get created category
    const newCategory = await queryOne(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        ...newCategory,
        is_active: Boolean(newCategory.is_active)
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

// PUT /api/v2/categories/:id - Update category (Admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    
    // Check if category exists
    const existing = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const { name_ar, description_ar, color, sort_order, is_active } = req.body;
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (name_ar !== undefined) {
      updates.push('name_ar = ?');
      params.push(name_ar.trim());
      
      // Regenerate slug if name changed
      if (name_ar !== existing.name_ar) {
        const baseSlug = generateCategorySlug(name_ar);
        let slug = baseSlug;
        let counter = 1;
        
        // Check for existing slugs and generate unique one
        const existingSlugs = await query('SELECT slug FROM categories WHERE slug LIKE ? AND id != ?', [`${baseSlug}%`, categoryId]);
        const slugSet = new Set(existingSlugs.map(row => row.slug));
        
        while (slugSet.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter += 1;
        }
        
        updates.push('slug = ?');
        params.push(slug);
      }
    }
    
    if (description_ar !== undefined) {
      updates.push('description_ar = ?');
      params.push(description_ar.trim());
    }
    
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    updates.push('updated_at = NOW()');
    params.push(categoryId);
    
    await query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated category
    const updated = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        ...updated,
        is_active: Boolean(updated.is_active)
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

// DELETE /api/v2/categories/bulk - Bulk delete categories (Admin only)
router.delete('/bulk', auth, requireAdmin, async (req, res) => {
  try {
    const { category_ids } = req.body;
    
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'category_ids must be a non-empty array'
      });
    }
    
    // Validate all IDs are numbers
    const validIds = category_ids.filter(id => !Number.isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
    
    if (validIds.length !== category_ids.length) {
      return res.status(400).json({
        success: false,
        error: 'All category_ids must be valid numbers'
      });
    }
    
    // Check for categories with posts
    const placeholders = validIds.map(() => '?').join(',');
    const categoriesWithPosts = await query(
      `SELECT c.id, c.name_ar, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id
       WHERE c.id IN (${placeholders})
       GROUP BY c.id, c.name_ar
       HAVING post_count > 0`,
      validIds
    );
    
    if (categoriesWithPosts.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Some categories have posts',
        data: { categories_with_posts: categoriesWithPosts }
      });
    }
    
    // Delete categories
    const result = await query(
      `DELETE FROM categories WHERE id IN (${placeholders})`,
      validIds
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows} categories deleted successfully`,
      data: { affected_rows: result.affectedRows }
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

// DELETE /api/v2/categories/:id - Delete category (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    
    // Check if category exists
    const category = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
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
        error: 'Cannot delete category with posts',
        message: `Category has ${postCount.count} posts. Please move or delete them first.`
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

// GET /api/v2/categories/:id/stats - Get category statistics (Admin/Editor only)
router.get('/:id/stats', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    
    // Check if category exists
    const category = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Get statistics
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_posts,
        SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as draft_posts,
        SUM(CASE WHEN is_featured = 1 AND is_published = 1 THEN 1 ELSE 0 END) as featured_posts,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(AVG(views), 0) as avg_views,
        COALESCE(MAX(views), 0) as max_views,
        COALESCE(AVG(reading_time), 0) as avg_reading_time
      FROM posts 
      WHERE category_id = ?
    `, [categoryId]);
    
    // Get top posts
    const topPosts = await query(`
      SELECT id, title_ar, slug, views, is_featured, created_at
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
          name_ar: category.name_ar,
          slug: category.slug
        },
        statistics: stats,
        top_posts: topPosts.map(post => ({
          ...post,
          is_featured: Boolean(post.is_featured)
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

module.exports = router;