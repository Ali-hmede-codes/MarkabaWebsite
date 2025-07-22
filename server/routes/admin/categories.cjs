const express = require('express');
const { body, validationResult, param } = require('express-validator');
const db = require('../../config/database.cjs');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth.cjs');


const router = express.Router();

// Get all categories with pagination and filtering
router.get('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'sort_order',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(c.name_ar LIKE ? OR c.description_ar LIKE ? OR c.slug LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status === 'active') {
      whereConditions.push('c.is_active = 1');
    } else if (status === 'inactive') {
      whereConditions.push('c.is_active = 0');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort parameters - Fixed SQL injection vulnerability
    const allowedSortFields = ['name_ar', 'slug', 'sort_order', 'is_active', 'created_at', 'updated_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'sort_order';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    // Build safe ORDER BY clause
    const orderByClause = `ORDER BY c.${validSortBy} ${validSortOrder}`;
    
    // Get categories with post count - Fixed SQL injection vulnerability
    const categoriesQuery = `
      SELECT 
        c.id,
        c.name_ar,
        c.slug,
        c.description_ar,
        c.sort_order,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as posts_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      ${whereClause}
      GROUP BY c.id
      ${orderByClause}
      LIMIT ${parseInt(limit, 10)} OFFSET ${offset}
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM categories c
      ${whereClause}
    `;
    
    // Execute queries with proper parameterization
    const [categories] = await db.execute(categoriesQuery, queryParams);
    const [countResult] = await db.execute(countQuery, queryParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit, 10));
    
    res.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit, 10),
        hasNextPage: parseInt(page, 10) < totalPages,
        hasPrevPage: parseInt(page, 10) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
    success: false,
    message: 'خطأ في الخادم الداخلي',
    error: error.message
  });
  }
});

// Get single category
router.get('/:id', 
  authenticateToken, 
  requireRole(['admin', 'editor']),
  param('id').isInt().withMessage('معرف التصنيف يجب أن يكون رقماً'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      
      const [categories] = await db.execute(
        `SELECT 
          c.id,
          c.name_ar,
          c.slug,
          c.description_ar,
          c.sort_order,
          c.is_active,
          c.created_at,
          c.updated_at,
          COUNT(p.id) as posts_count
        FROM categories c
        LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
        WHERE c.id = ?
        GROUP BY c.id`,
        [id]
      );
      
      if (categories.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التصنيف غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: categories[0]
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Create new category
router.post('/',
  authenticateToken,
  requireRole(['admin', 'editor']),
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('اسم التصنيف يجب أن يكون بين 2 و 100 حرف'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الرابط المختصر يجب أن يكون بين 2 و 100 حرف')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('الرابط المختصر يجب أن يحتوي على أحرف صغيرة وأرقام و - فقط'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('الوصف يجب أن يكون أقل من 500 حرف'),
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('ترتيب العرض يجب أن يكون رقماً موجباً'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('حالة النشاط يجب أن تكون true أو false')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      let { name, slug, description, sort_order, is_active } = req.body;
      
      // Generate slug if not provided - Improved security and validation
      if (!slug) {
        slug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 100); // Limit length
        
        // Ensure slug is not empty after sanitization
        if (!slug) {
          return res.status(400).json({
            success: false,
            message: 'لا يمكن إنشاء رابط مختصر صالح من الاسم المدخل'
          });
        }
      }
      
      // Set default values and sanitize inputs
      description = description ? description.trim() : '';
      sort_order = sort_order || 0;
      is_active = is_active !== undefined ? is_active : true;
      
      // Additional security: Ensure name is properly sanitized
      name = name.trim();
      slug = slug.trim();
      
      // Check if slug already exists
      const [existingCategories] = await db.execute(
        'SELECT id FROM categories WHERE slug = ?',
        [slug]
      );
      
      if (existingCategories.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'الرابط المختصر موجود بالفعل'
        });
      }
      
      // Insert new category
      const [result] = await db.execute(
        `INSERT INTO categories (name, slug, description, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, slug, description, sort_order, is_active]
      );
      
      // Get the created category
      const [newCategory] = await db.execute(
        `SELECT id, name, slug, description, sort_order, is_active, created_at, updated_at
         FROM categories WHERE id = ?`,
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء التصنيف بنجاح',
        data: newCategory[0]
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Update category
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'editor']),
  [
    param('id').isInt().withMessage('معرف التصنيف يجب أن يكون رقماً'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('اسم التصنيف يجب أن يكون بين 2 و 100 حرف'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الرابط المختصر يجب أن يكون بين 2 و 100 حرف')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('الرابط المختصر يجب أن يحتوي على أحرف صغيرة وأرقام و - فقط'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('الوصف يجب أن يكون أقل من 500 حرف'),
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('ترتيب العرض يجب أن يكون رقماً موجباً'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('حالة النشاط يجب أن تكون true أو false')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      // Check if category exists
      const [existingCategory] = await db.execute(
        'SELECT id FROM categories WHERE id = ?',
        [id]
      );
      
      if (existingCategory.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التصنيف غير موجود'
        });
      }
      
      // Check for duplicate slug (excluding current category)
      if (updateData.slug) {
        const [duplicateCategories] = await db.execute(
          'SELECT id FROM categories WHERE slug = ? AND id != ?',
          [updateData.slug, id]
        );
        
        if (duplicateCategories.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'الرابط المختصر موجود بالفعل'
          });
        }
      }
      
      // Prepare update fields - Fixed SQL injection vulnerability
      const allowedUpdateFields = ['name', 'slug', 'description', 'sort_order', 'is_active'];
      const updateFields = [];
      const updateValues = [];
      
      // Only allow whitelisted fields to prevent SQL injection
      Object.keys(updateData).forEach(key => {
        if (allowedUpdateFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات صالحة للتحديث'
        });
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      // Update category with safe field names
      await db.execute(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Get updated category
      const [updatedCategory] = await db.execute(
        `SELECT id, name, slug, description, sort_order, is_active, created_at, updated_at
         FROM categories WHERE id = ?`,
        [id]
      );
      
      res.json({
        success: true,
        message: 'تم تحديث التصنيف بنجاح',
        data: updatedCategory[0]
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Delete category
router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'editor']),
  param('id').isInt().withMessage('معرف التصنيف يجب أن يكون رقماً'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      
      // Check if category exists
      const [existingCategory] = await db.execute(
        'SELECT id, name_ar FROM categories WHERE id = ?',
        [id]
      );
      
      if (existingCategory.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التصنيف غير موجود'
        });
      }
      
      // Check if category has posts
      const [categoryPosts] = await db.execute(
        'SELECT COUNT(*) as post_count FROM posts WHERE category_id = ?',
        [id]
      );
      
      if (categoryPosts[0].post_count > 0) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف التصنيف لأنه يحتوي على مقالات. يرجى نقل أو حذف المقالات أولاً'
        });
      }
      
      // Delete category
      await db.execute('DELETE FROM categories WHERE id = ?', [id]);
      
      res.json({
        success: true,
        message: 'تم حذف التصنيف بنجاح'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Get category statistics
router.get('/stats/overview', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_categories,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_categories,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_categories
      FROM categories
    `);
    
    // Get categories with most posts
    const [topCategories] = await db.execute(`
      SELECT 
        c.id,
        c.name_ar,
        COUNT(p.id) as posts_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
      WHERE c.is_active = 1
      GROUP BY c.id, c.name_ar
      ORDER BY posts_count DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        ...stats[0],
        top_categories: topCategories
      }
    });
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Reorder categories
router.put('/reorder', 
  authenticateToken,
  requireRole(['admin', 'editor']),
  [
    body('categories')
      .isArray({ min: 1 })
      .withMessage('يجب أن تكون التصنيفات مصفوفة غير فارغة'),
    body('categories.*.id')
      .isInt()
      .withMessage('معرف التصنيف يجب أن يكون رقماً'),
    body('categories.*.sort_order')
      .isInt({ min: 0 })
      .withMessage('ترتيب العرض يجب أن يكون رقماً موجباً')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const { categories } = req.body;
      
      // Validate that all category IDs exist before starting transaction
      const categoryIds = categories.map(cat => cat.id);
      
      // Safely construct IN clause with proper validation
      if (categoryIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد تصنيفات للتحديث'
        });
      }
      
      // Limit the number of categories that can be updated at once
      if (categoryIds.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'عدد التصنيفات كبير جداً. الحد الأقصى 100 تصنيف'
        });
      }
      
      const placeholders = categoryIds.map(() => '?').join(',');
      const query = `SELECT id FROM categories WHERE id IN (${placeholders})`;
      const [existingCategories] = await db.execute(query, categoryIds);
      
      if (existingCategories.length !== categories.length) {
        return res.status(400).json({
          success: false,
          message: 'بعض التصنيفات المحددة غير موجودة'
        });
      }
      
      // Start transaction
      await db.execute('START TRANSACTION');
      
      try {
        // Update sort order for each category
        await Promise.all(categories.map(async (category) => 
          db.execute(
            'UPDATE categories SET sort_order = ?, updated_at = NOW() WHERE id = ?',
            [category.sort_order, category.id]
          )
        ));
        
        // Commit transaction
        await db.execute('COMMIT');
        
        res.json({
          success: true,
          message: 'تم تحديث ترتيب التصنيفات بنجاح'
        });
      } catch (error) {
        // Rollback transaction
        await db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

module.exports = router;