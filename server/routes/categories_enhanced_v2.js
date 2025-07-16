const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { query, queryOne } = require('../db');
const { auth, requireAdminOrEditor } = require('../middlewares/auth');
const { generateArabicSlug } = require('../utils/postUtils');

const router = express.Router();

// Helper function to generate unique slug
async function generateUniqueSlug(name, categoryId = null) {
  const baseSlug = generateArabicSlug(name);
  let slug = baseSlug;
  let counter = 1;
  
  const existingSlugs = new Set();
  let checkQuery = 'SELECT slug FROM categories WHERE slug LIKE ?';
  const checkParams = [`${baseSlug}%`];
  
  if (categoryId) {
    checkQuery += ' AND id != ?';
    checkParams.push(categoryId);
  }
  
  const existingCategories = await query(checkQuery, checkParams);
  existingCategories.forEach(category => existingSlugs.add(category.slug));
  
  while (existingSlugs.has(slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}

// Helper function to create JSON export files
async function createCategoriesExportFiles(categories) {
  try {
    const exportDir = path.join(__dirname, '../../client/data');
    
    // Ensure export directory exists
    try {
      await fs.access(exportDir);
    } catch (error) {
      await fs.mkdir(exportDir, { recursive: true });
    }
    
    // Create categories.json file
    const categoriesData = {
      categories: categories.map(category => ({
        id: category.id,
        name_ar: category.name_ar,
        description_ar: category.description_ar,
        slug: category.slug,
        parent_id: category.parent_id,
        parent_name: category.parent_name,
        sort_order: category.sort_order,
        is_active: Boolean(category.is_active),
        post_count: category.post_count || 0,
        created_at: category.created_at,
        updated_at: category.updated_at
      })),
      generated_at: new Date().toISOString(),
      total_count: categories.length
    };
    
    await fs.writeFile(
      path.join(exportDir, 'categories.json'),
      JSON.stringify(categoriesData, null, 2),
      'utf8'
    );
    
    console.log('Categories JSON export created successfully');
    return true;
  } catch (error) {
    console.error('Failed to create categories JSON export:', error);
    return false;
  }
}

// GET / - Get all categories with hierarchy (Public)
router.get('/', async (req, res) => {
  try {
    const {
      include_inactive = 'false',
      parent_id,
      search,
      sort_by = 'sort_order',
      sort_order = 'asc',
      export_json
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['sort_order', 'name_ar', 'created_at', 'post_count'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'sort_order';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'asc';

    let baseQuery = `
      SELECT c.*, 
             pc.name_ar as parent_name,
             COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (include_inactive !== 'true') {
      baseQuery += ' AND c.is_active = 1';
    }
    
    if (parent_id !== undefined) {
      if (parent_id === 'null' || parent_id === '') {
        baseQuery += ' AND c.parent_id IS NULL';
      } else {
        baseQuery += ' AND c.parent_id = ?';
        params.push(parseInt(parent_id, 10));
      }
    }
    
    if (search) {
      baseQuery += ' AND (c.name_ar LIKE ? OR c.description_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    baseQuery += ` GROUP BY c.id ORDER BY c.${finalSortBy} ${finalSortOrder.toUpperCase()}`;
    
    const categories = await query(baseQuery, params);
    
    // Process categories
    const processedCategories = categories.map(category => ({
      ...category,
      is_active: Boolean(category.is_active),
      post_count: parseInt(category.post_count, 10) || 0
    }));
    
    // Create JSON export if requested
    if (export_json === 'true') {
      await createCategoriesExportFiles(processedCategories);
    }
    
    res.json({
      success: true,
      data: processedCategories,
      filters: {
        include_inactive,
        parent_id,
        search,
        sort_by: finalSortBy,
        sort_order: finalSortOrder
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

// GET /tree - Get categories in tree structure (Public)
router.get('/tree', async (req, res) => {
  try {
    const { include_inactive = 'false', export_json } = req.query;
    
    let queryStr = `
      SELECT c.*, 
             COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE 1=1
    `;
    
    const params = [];
    
    if (include_inactive !== 'true') {
      queryStr += ' AND c.is_active = 1';
    }
    
    queryStr += ' GROUP BY c.id ORDER BY c.sort_order ASC';
    
    const categories = await query(queryStr, params);
    
    // Build tree structure
    const categoryMap = new Map();
    const rootCategories = [];
    
    // First pass: create all category objects
    categories.forEach(category => {
      const processedCategory = {
        ...category,
        is_active: Boolean(category.is_active),
        post_count: parseInt(category.post_count, 10) || 0,
        children: []
      };
      categoryMap.set(category.id, processedCategory);
    });
    
    // Second pass: build tree structure
    categories.forEach(category => {
      const processedCategory = categoryMap.get(category.id);
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(processedCategory);
        } else {
          rootCategories.push(processedCategory);
        }
      } else {
        rootCategories.push(processedCategory);
      }
    });
    
    // Create JSON export if requested
    if (export_json === 'true') {
      await createCategoriesExportFiles(Array.from(categoryMap.values()));
    }
    
    res.json({
      success: true,
      data: rootCategories
    });
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category tree',
      message: error.message
    });
  }
});

// GET /export - Export all categories as JSON (Admin/Editor only)
router.get('/export', requireAdminOrEditor, async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, 
             pc.name_ar as parent_name,
             COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `);
    
    const processedCategories = categories.map(category => ({
      ...category,
      is_active: Boolean(category.is_active),
      post_count: parseInt(category.post_count, 10) || 0
    }));
    
    // Create JSON export file
    await createCategoriesExportFiles(processedCategories);
    
    res.json({
      success: true,
      message: 'Categories exported successfully',
      data: {
        total_categories: processedCategories.length,
        export_path: '/client/data/categories.json',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error exporting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export categories',
      message: error.message
    });
  }
});

// GET /:id - Get single category by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    
    const category = await queryOne(`
      SELECT c.*, 
             pc.name_ar as parent_name,
             COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE c.id = ?
      GROUP BY c.id
    `, [categoryId]);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const processedCategory = {
      ...category,
      is_active: Boolean(category.is_active),
      post_count: parseInt(category.post_count, 10) || 0
    };
    
    res.json({
      success: true,
      data: processedCategory
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

// GET /slug/:slug - Get single category by slug (Public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await queryOne(`
      SELECT c.*, 
             pc.name_ar as parent_name,
             COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE c.slug = ?
      GROUP BY c.id
    `, [slug]);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const processedCategory = {
      ...category,
      is_active: Boolean(category.is_active),
      post_count: parseInt(category.post_count, 10) || 0
    };
    
    res.json({
      success: true,
      data: processedCategory
    });
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
      message: error.message
    });
  }
});

// POST / - Create new category (Admin/Editor only)
router.post('/', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const {
      name_ar,
      description_ar,
      parent_id,
      sort_order = 0,
      is_active = true
    } = req.body;
    
    // Validate required fields
    if (!name_ar) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    // Generate unique slug
    const slug = await generateUniqueSlug(name_ar);
    
    const result = await query(`
      INSERT INTO categories (
        name_ar, description_ar, slug, parent_id, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name_ar,
      description_ar,
      slug,
      parent_id || null,
      parseInt(sort_order, 10),
      is_active ? 1 : 0
    ]);
    
    const newCategory = await queryOne(`
      SELECT c.*, 
             pc.name_ar as parent_name,
             COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE c.id = ?
      GROUP BY c.id
    `, [result.insertId]);
    
    const processedCategory = {
      ...newCategory,
      is_active: Boolean(newCategory.is_active),
      post_count: parseInt(newCategory.post_count, 10) || 0
    };
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: processedCategory
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

// PUT /:id - Update category (Admin/Editor only)
router.put('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    
    const existingCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const {
      name_ar,
      description_ar,
      parent_id,
      sort_order,
      is_active
    } = req.body;
    
    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (name_ar && name_ar !== existingCategory.name_ar) {
      slug = await generateUniqueSlug(name_ar, categoryId);
    }
    
    // Handle boolean value for database
    let activeValue = null;
    if (is_active !== undefined) {
      activeValue = is_active ? 1 : 0;
    }
    
    await query(`
      UPDATE categories SET
        name_ar = COALESCE(?, name_ar),
        description_ar = COALESCE(?, description_ar),
        slug = ?,
        parent_id = ?,
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name_ar,
      description_ar,
      slug,
      parent_id !== undefined ? (parent_id || null) : existingCategory.parent_id,
      sort_order !== undefined ? parseInt(sort_order, 10) : null,
      activeValue,
      categoryId
    ]);
    
    const updatedCategory = await queryOne(`
      SELECT c.*, 
             pc.name_ar as parent_name,
             COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE c.id = ?
      GROUP BY c.id
    `, [categoryId]);
    
    const processedCategory = {
      ...updatedCategory,
      is_active: Boolean(updatedCategory.is_active),
      post_count: parseInt(updatedCategory.post_count, 10) || 0
    };
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: processedCategory
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

// DELETE /:id - Delete category (Admin only)
router.delete('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }
    
    const existingCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Check if category has posts
    const postCount = await queryOne('SELECT COUNT(*) as count FROM posts WHERE category_id = ?', [categoryId]);
    
    if (postCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing posts'
      });
    }
    
    // Check if category has child categories
    const childCount = await queryOne('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?', [categoryId]);
    
    if (childCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with child categories'
      });
    }
    
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

// GET /stats/overview - Get categories statistics (Admin/Editor only)
router.get('/stats/overview', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_categories,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_categories,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_categories,
        SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as root_categories,
        SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as child_categories
      FROM categories
    `);
    
    const categoryPostCounts = await query(`
      SELECT 
        c.name_ar as category_name,
        c.slug as category_slug,
        COUNT(p.id) as post_count,
        SUM(p.views) as total_views
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE c.is_active = 1
      GROUP BY c.id, c.name_ar, c.slug
      ORDER BY post_count DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        overview: stats[0],
        top_categories: categoryPostCounts
      }
    });
  } catch (error) {
    console.error('Error fetching categories statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;