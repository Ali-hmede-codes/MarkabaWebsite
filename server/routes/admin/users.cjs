const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, param } = require('express-validator');
const db = require('../../config/database.cjs');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth.cjs');

const router = express.Router();

// Get all users with pagination and filtering
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ? OR u.display_name LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }
    
    if (status === 'active') {
      whereConditions.push('u.is_active = 1');
    } else if (status === 'inactive') {
      whereConditions.push('u.is_active = 0');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort parameters
    const allowedSortFields = ['username', 'email', 'display_name', 'role', 'is_active', 'created_at', 'updated_at', 'last_login'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Get users with post count
    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.display_name,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        COUNT(p.id) as posts_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.${validSortBy} ${validSortOrder}
      LIMIT ${parseInt(limit, 10)} OFFSET ${offset}
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;
    
    // Execute queries
    const [users] = await db.execute(usersQuery, queryParams);
    const [countResult] = await db.execute(countQuery, queryParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit, 10));
    
    // Remove password from response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({
      success: true,
      data: sanitizedUsers,
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
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Get single user
router.get('/:id', 
  authenticateToken, 
  requireRole(['admin']),
  param('id').isInt().withMessage('معرف المستخدم يجب أن يكون رقماً'),
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
      
      const [users] = await db.execute(
        `SELECT 
          u.id,
          u.username,
          u.email,
          u.display_name,
          u.role,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at,
          COUNT(p.id) as posts_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        WHERE u.id = ?
        GROUP BY u.id`,
        [id]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: users[0]
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Create new user
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('اسم المستخدم يجب أن يحتوي على أحرف وأرقام و _ فقط'),
    body('email')
      .isEmail()
      .withMessage('البريد الإلكتروني غير صحيح')
      .normalizeEmail(),
    body('display_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم المعروض يجب أن يكون بين 2 و 100 حرف'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('role')
      .isIn(['admin', 'editor', 'author'])
      .withMessage('الدور غير صحيح'),
    body('is_active')
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

      const { username, email, display_name, password, role, is_active } = req.body;
      
      // Check if username or email already exists
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Insert new user
      const [result] = await db.execute(
        `INSERT INTO users (username, email, display_name, password, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [username, email, display_name, hashedPassword, role, is_active]
      );
      
      // Get the created user (without password)
      const [newUser] = await db.execute(
        `SELECT id, username, email, display_name, role, is_active, created_at, updated_at
         FROM users WHERE id = ?`,
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        data: newUser[0]
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Update user
router.put('/:id',
  authenticateToken,
  requireRole(['admin']),
  [
    param('id').isInt().withMessage('معرف المستخدم يجب أن يكون رقماً'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('اسم المستخدم يجب أن يحتوي على أحرف وأرقام و _ فقط'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('البريد الإلكتروني غير صحيح')
      .normalizeEmail(),
    body('display_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم المعروض يجب أن يكون بين 2 و 100 حرف'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('role')
      .optional()
      .isIn(['admin', 'editor', 'author'])
      .withMessage('الدور غير صحيح'),
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
      
      // Check if user exists
      const [existingUser] = await db.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );
      
      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      // Check for duplicate username/email (excluding current user)
      if (updateData.username || updateData.email) {
        const checkFields = [];
        const checkValues = [];
        
        if (updateData.username) {
          checkFields.push('username = ?');
          checkValues.push(updateData.username);
        }
        
        if (updateData.email) {
          checkFields.push('email = ?');
          checkValues.push(updateData.email);
        }
        
        const [duplicateUsers] = await db.execute(
          `SELECT id FROM users WHERE (${checkFields.join(' OR ')}) AND id != ?`,
          [...checkValues, id]
        );
        
        if (duplicateUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل'
          });
        }
      }
      
      // Prepare update fields
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(updateData).forEach(key => {
        if (key === 'password' && updateData[key]) {
          // Hash password if provided
          updateFields.push('password = ?');
          updateValues.push(bcrypt.hashSync(updateData[key], 12));
        } else if (key !== 'password') {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات للتحديث'
        });
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      // Update user
      await db.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Get updated user (without password)
      const [updatedUser] = await db.execute(
        `SELECT id, username, email, display_name, role, is_active, created_at, updated_at
         FROM users WHERE id = ?`,
        [id]
      );
      
      res.json({
        success: true,
        message: 'تم تحديث المستخدم بنجاح',
        data: updatedUser[0]
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Change user password
router.put('/:id/password',
  authenticateToken,
  requireRole(['admin']),
  [
    param('id').isInt().withMessage('معرف المستخدم يجب أن يكون رقماً'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
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
      const { password } = req.body;
      
      // Check if user exists
      const [existingUser] = await db.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );
      
      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update password
      await db.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, id]
      );
      
      res.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Delete user
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  param('id').isInt().withMessage('معرف المستخدم يجب أن يكون رقماً'),
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
      
      // Check if user exists
      const [existingUser] = await db.execute(
        'SELECT id, username FROM users WHERE id = ?',
        [id]
      );
      
      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      // Prevent deleting the current user
      if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكنك حذف حسابك الخاص'
        });
      }
      
      // Check if user has posts
      const [userPosts] = await db.execute(
        'SELECT COUNT(*) as post_count FROM posts WHERE author_id = ?',
        [id]
      );
      
      if (userPosts[0].post_count > 0) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف المستخدم لأنه يملك مقالات. يرجى حذف أو نقل المقالات أولاً'
        });
      }
      
      // Delete user
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      
      res.json({
        success: true,
        message: 'تم حذف المستخدم بنجاح'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Get user statistics
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'editor' THEN 1 ELSE 0 END) as editor_users,
        SUM(CASE WHEN role = 'author' THEN 1 ELSE 0 END) as author_users,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_last_month
      FROM users
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

module.exports = router;