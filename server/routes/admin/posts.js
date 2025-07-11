const express = require('express');
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../config/database');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth');


const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/posts');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()  }-${  Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname  }-${  uniqueSuffix  }${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } 
      cb(new Error('يُسمح فقط بملفات الصور (JPEG, JPG, PNG, GIF, WebP)'));
    
  }
});

// Get all posts with pagination and filtering
router.get('/', authenticateToken, requireRole(['admin', 'editor', 'author']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      category = '',
      author = '',
      featured = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      whereConditions.push('p.status = ?');
      queryParams.push(status);
    }
    
    if (category) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category);
    }
    
    if (author) {
      whereConditions.push('p.author_id = ?');
      queryParams.push(author);
    }
    
    if (featured === 'true') {
      whereConditions.push('p.is_featured = 1');
    } else if (featured === 'false') {
      whereConditions.push('p.is_featured = 0');
    }
    
    // If user is not admin, only show their own posts (for authors)
    if (req.user.role === 'author') {
      whereConditions.push('p.author_id = ?');
      queryParams.push(req.user.id);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort parameters
    const allowedSortFields = ['title', 'status', 'is_featured', 'created_at', 'updated_at', 'published_at', 'views'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Build safe ORDER BY clause
    const orderByClause = `ORDER BY p.${validSortBy} ${validSortOrder}`;
    
    // Get posts with author and category info
    const postsQuery = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.featured_image,
        p.status,
        p.is_featured,
        p.views,
        p.created_at,
        p.updated_at,
        p.published_at,
        u.display_name as author_name,
        u.username as author_username,
        c.name_ar as category_name,
        c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    
    // Execute queries
    const [posts] = await db.execute(postsQuery, [...queryParams, parseInt(limit, 10), offset]);
    const [countResult] = await db.execute(countQuery, queryParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit, 10));
    
    res.json({
      success: true,
      data: posts,
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
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Get single post
router.get('/:id', 
  authenticateToken, 
  requireRole(['admin', 'editor', 'author']),
  param('id').isInt().withMessage('معرف المقال يجب أن يكون رقماً'),
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
      
      let whereClause = 'WHERE p.id = ?';
      const queryParams = [id];
      
      // If user is author, only allow access to their own posts
      if (req.user.role === 'author') {
        whereClause += ' AND p.author_id = ?';
        queryParams.push(req.user.id);
      }
      
      const [posts] = await db.execute(
        `SELECT 
          p.id,
          p.title_ar,
          p.content_ar,
          p.excerpt_ar,
          p.slug,
          p.featured_image,
          p.category_id,
          p.author_id,
          p.is_published,
          p.is_featured,
          p.meta_description_ar,
          p.created_at,
          p.updated_at,
          u.display_name as author_name,
          u.username as author_username,
          c.name_ar as category_name,
          c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}`,
        queryParams
      );
      
      if (posts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المقال غير موجود أو ليس لديك صلاحية للوصول إليه'
        });
      }
      
      res.json({
        success: true,
        data: posts[0]
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Create new post
router.post('/',
  authenticateToken,
  requireRole(['admin', 'editor', 'author']),
  upload.single('featured_image'),
  [
    body('title_ar')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('عنوان المقال يجب أن يكون بين 5 و 200 حرف'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('الرابط المختصر يجب أن يكون بين 5 و 200 حرف')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('الرابط المختصر يجب أن يحتوي على أحرف صغيرة وأرقام و - فقط'),
    body('content_ar')
      .trim()
      .isLength({ min: 50 })
      .withMessage('محتوى المقال يجب أن يكون 50 حرف على الأقل'),
    body('excerpt_ar')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('المقتطف يجب أن يكون أقل من 500 حرف'),
    body('category_id')
      .isInt()
      .withMessage('معرف التصنيف يجب أن يكون رقماً'),
    body('status')
      .isIn(['draft', 'published', 'archived'])
      .withMessage('حالة المقال غير صحيحة'),
    body('is_featured')
      .optional()
      .isBoolean()
      .withMessage('حالة الإبراز يجب أن تكون true أو false'),
    body('meta_description_ar')
      .optional()
      .trim()
      .isLength({ max: 160 })
      .withMessage('وصف SEO يجب أن يكون أقل من 160 حرف')
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

      let { 
        title_ar, 
        slug, 
        content_ar, 
        excerpt_ar, 
        is_featured, 
        meta_description_ar 
      } = req.body;
      
      const { category_id, status } = req.body;
      
      // Sanitize and trim input data
      if (title_ar) title_ar = title_ar.trim();
      if (content_ar) content_ar = content_ar.trim();
      if (excerpt_ar) excerpt_ar = excerpt_ar.trim();
      if (meta_description_ar) meta_description_ar = meta_description_ar.trim();
      
      // Generate slug if not provided
      if (!slug) {
        slug = title_ar
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
      } else {
        slug = slug.trim();
      }
      
      // Validate slug is not empty after sanitization
      if (!slug || slug.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'الرابط المختصر غير صحيح أو قصير جداً'
        });
      }
      
      // Set default values
      excerpt_ar = excerpt_ar || `${content_ar.substring(0, 200)  }...`;
      is_featured = is_featured !== undefined ? is_featured : false;
      meta_description_ar = meta_description_ar || excerpt_ar;
      
      // Check if slug already exists
      const [existingPosts] = await db.execute(
        'SELECT id FROM posts WHERE slug = ?',
        [slug]
      );
      
      if (existingPosts.length > 0) {
        slug = `${slug  }-${  Date.now()}`;
      }
      
      // Check if category exists
      const [categories] = await db.execute(
        'SELECT id FROM categories WHERE id = ? AND is_active = 1',
        [category_id]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'التصنيف غير موجود أو غير نشط'
        });
      }
      
      // Handle featured image
      let featured_image = null;
      if (req.file) {
        featured_image = `/uploads/posts/${req.file.filename}`;
      }
      
      // Convert status to is_published boolean for database storage
      
      // Insert new post
      const [result] = await db.execute(
        `INSERT INTO posts (
          title_ar, slug, content_ar, excerpt_ar, featured_image, category_id, author_id, 
          is_published, is_featured, meta_description_ar, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          title_ar, slug, content_ar, excerpt_ar, featured_image, category_id, req.user.id,
          status === 'published', is_featured, meta_description_ar
        ]
      );
      
      // Get the created post
      const [newPost] = await db.execute(
        `SELECT 
          p.id,
          p.title_ar as title,
          p.content_ar as content,
          p.excerpt_ar as excerpt,
          p.slug,
          p.featured_image,
          p.category_id,
          p.author_id,
          p.is_published,
          p.is_featured,
          p.meta_description_ar as meta_description,
          p.created_at,
          p.updated_at,
          u.display_name as author_name,
          c.name_ar as category_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?`,
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء المقال بنجاح',
        data: newPost[0]
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Update post
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'editor', 'author']),
  upload.single('featured_image'),
  [
    param('id').isInt().withMessage('معرف المقال يجب أن يكون رقماً'),
    body('title_ar')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('عنوان المقال يجب أن يكون بين 5 و 200 حرف'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('الرابط المختصر يجب أن يكون بين 5 و 200 حرف')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('الرابط المختصر يجب أن يحتوي على أحرف صغيرة وأرقام و - فقط'),
    body('content_ar')
      .optional()
      .trim()
      .isLength({ min: 50 })
      .withMessage('محتوى المقال يجب أن يكون 50 حرف على الأقل'),
    body('excerpt_ar')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('المقتطف يجب أن يكون أقل من 500 حرف'),
    body('category_id')
      .optional()
      .isInt()
      .withMessage('معرف التصنيف يجب أن يكون رقماً'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('حالة المقال غير صحيحة'),
    body('is_featured')
      .optional()
      .isBoolean()
      .withMessage('حالة الإبراز يجب أن تكون true أو false'),
    body('meta_description_ar')
      .optional()
      .trim()
      .isLength({ max: 160 })
      .withMessage('وصف SEO يجب أن يكون أقل من 160 حرف')
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
      const updateData = { ...req.body };
      
      // Sanitize and trim input data
      if (updateData.title_ar) updateData.title_ar = updateData.title_ar.trim();
      if (updateData.slug) updateData.slug = updateData.slug.trim();
      if (updateData.content_ar) updateData.content_ar = updateData.content_ar.trim();
      if (updateData.excerpt_ar) updateData.excerpt_ar = updateData.excerpt_ar.trim();
      if (updateData.meta_description_ar) updateData.meta_description_ar = updateData.meta_description_ar.trim();
      
      // Validate slug if provided
      if (updateData.slug && updateData.slug.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'الرابط المختصر قصير جداً'
        });
      }
      
      // Check if post exists and user has permission
      let whereClause = 'WHERE id = ?';
      const queryParams = [id];
      
      if (req.user.role === 'author') {
        whereClause += ' AND author_id = ?';
        queryParams.push(req.user.id);
      }
      
      const [existingPost] = await db.execute(
        `SELECT id, featured_image, is_published FROM posts ${whereClause}`,
        queryParams
      );
      
      if (existingPost.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المقال غير موجود أو ليس لديك صلاحية لتعديله'
        });
      }
      
      // Check for duplicate slug (excluding current post)
      if (updateData.slug) {
        const [duplicatePosts] = await db.execute(
          'SELECT id FROM posts WHERE slug = ? AND id != ?',
          [updateData.slug, id]
        );
        
        if (duplicatePosts.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'الرابط المختصر موجود بالفعل'
          });
        }
      }
      
      // Check if category exists (if provided)
      if (updateData.category_id) {
        const [categories] = await db.execute(
          'SELECT id FROM categories WHERE id = ? AND is_active = 1',
          [updateData.category_id]
        );
        
        if (categories.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'التصنيف غير موجود أو غير نشط'
          });
        }
      }
      
      // Handle featured image
      if (req.file) {
        // Delete old image if exists
        if (existingPost[0].featured_image) {
          const oldImagePath = path.join(__dirname, '../../public', existingPost[0].featured_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.featured_image = `/uploads/posts/${req.file.filename}`;
      }
      
      // Convert status to is_published boolean
      if (updateData.status !== undefined) {
        updateData.is_published = updateData.status === 'published';
        delete updateData.status; // Remove status from updateData since we use is_published
      }
      
      // Whitelist allowed update fields to prevent SQL injection
      const allowedUpdateFields = [
        'title_ar', 'slug', 'content_ar', 'excerpt_ar', 'featured_image', 'category_id',
        'is_published', 'is_featured', 'meta_description_ar'
      ];
      
      // Prepare update fields with whitelist validation
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(updateData).forEach(key => {
        if (allowedUpdateFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات صحيحة للتحديث'
        });
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      // Update post
      await db.execute(
        `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Get updated post
      const [updatedPost] = await db.execute(
        `SELECT 
          p.id,
          p.title_ar as title,
          p.content_ar as content,
          p.excerpt_ar as excerpt,
          p.slug,
          p.featured_image,
          p.category_id,
          p.author_id,
          p.is_published,
          p.is_featured,
          p.meta_description_ar as meta_description,
          p.created_at,
          p.updated_at,
          u.display_name as author_name,
          c.name_ar as category_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?`,
        [id]
      );
      
      res.json({
        success: true,
        message: 'تم تحديث المقال بنجاح',
        data: updatedPost[0]
      });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Delete post
router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'editor', 'author']),
  param('id').isInt().withMessage('معرف المقال يجب أن يكون رقماً'),
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
      
      // Check if post exists and user has permission
      let whereClause = 'WHERE id = ?';
      const queryParams = [id];
      
      if (req.user.role === 'author') {
        whereClause += ' AND author_id = ?';
        queryParams.push(req.user.id);
      }
      
      const [existingPost] = await db.execute(
        `SELECT id, title_ar, featured_image FROM posts ${whereClause}`,
        queryParams
      );
      
      if (existingPost.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المقال غير موجود أو ليس لديك صلاحية لحذفه'
        });
      }
      
      // Delete featured image if exists
      if (existingPost[0].featured_image) {
        const imagePath = path.join(__dirname, '../../public', existingPost[0].featured_image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete post
      await db.execute('DELETE FROM posts WHERE id = ?', [id]);
      
      res.json({
        success: true,
        message: 'تم حذف المقال بنجاح'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Toggle post featured status
router.patch('/:id/featured',
  authenticateToken,
  requireRole(['admin', 'editor']),
  param('id').isInt().withMessage('معرف المقال يجب أن يكون رقماً'),
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
      
      // Get current featured status
      const [post] = await db.execute(
        'SELECT id, is_featured FROM posts WHERE id = ?',
        [id]
      );
      
      if (post.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المقال غير موجود'
        });
      }
      
      const newFeaturedStatus = !post[0].is_featured;
      
      // Update featured status
      await db.execute(
        'UPDATE posts SET is_featured = ?, updated_at = NOW() WHERE id = ?',
        [newFeaturedStatus, id]
      );
      
      res.json({
        success: true,
        message: newFeaturedStatus ? 'تم إبراز المقال' : 'تم إلغاء إبراز المقال',
        data: { is_featured: newFeaturedStatus }
      });
    } catch (error) {
      console.error('Error toggling post featured status:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Toggle post status
router.patch('/:id/status',
  authenticateToken,
  requireRole(['admin', 'editor', 'author']),
  [
    param('id').isInt().withMessage('معرف المقال يجب أن يكون رقماً'),
    body('status').isIn(['draft', 'published', 'archived']).withMessage('حالة المقال غير صحيحة')
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
      const { status } = req.body;
      
      // Check if post exists and user has permission
      let whereClause = 'WHERE id = ?';
      const queryParams = [id];
      
      if (req.user.role === 'author') {
        whereClause += ' AND author_id = ?';
        queryParams.push(req.user.id);
      }
      
      const [post] = await db.execute(
        `SELECT id, is_published FROM posts ${whereClause}`,
        queryParams
      );
      
      if (post.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المقال غير موجود أو ليس لديك صلاحية لتعديله'
        });
      }
      
      // Convert status to boolean
      const is_published = status === 'published';
      
      // Update status
      await db.execute(
        'UPDATE posts SET is_published = ?, updated_at = NOW() WHERE id = ?',
        [is_published, id]
      );
      
      res.json({
        success: true,
        message: 'تم تحديث حالة المقال بنجاح',
        data: { status, is_published }
      });
    } catch (error) {
      console.error('Error updating post status:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Get post statistics
router.get('/stats/overview', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_posts,
        SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as draft_posts,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_posts,
        SUM(views) as total_views
      FROM posts
    `);
    
    // Get recent posts
    const [recentPosts] = await db.execute(`
      SELECT 
        p.id,
        p.title_ar as title,
        p.is_published,
        p.created_at,
        u.display_name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        ...stats[0],
        recent_posts: recentPosts
      }
    });
  } catch (error) {
    console.error('Error fetching post statistics:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

module.exports = router;