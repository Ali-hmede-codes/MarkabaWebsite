const express = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../db.cjs')
const { auth, requireAdmin, requireAdminOrEditor } = require('../middlewares/auth.cjs')

const router = express.Router();

// Get all users with filtering (Admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = (page - 1) * limit;
    
    const {
      role,
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      include_stats = 'false'
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['created_at', 'username', 'email', 'display_name', 'last_login', 'role'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';
    
    let queryStr = `
      SELECT u.id, u.username, u.email, u.display_name, u.role, u.is_active, 
             u.avatar, u.bio, u.last_login, u.failed_login_attempts, u.account_locked_until,
             u.created_at, u.updated_at`;
    
    if (include_stats === 'true') {
      queryStr += `,
             (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) as post_count,
             (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.is_published = 1) as published_posts,
             (SELECT SUM(p.views) FROM posts p WHERE p.author_id = u.id) as total_views`;
    }
    
    queryStr += `
      FROM users u
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (role) {
      queryStr += ' AND u.role = ?';
      params.push(role);
    }
    
    if (status) {
      if (status === 'active') {
        queryStr += ' AND u.is_active = 1 AND (u.account_locked_until IS NULL OR u.account_locked_until < NOW())';
      } else if (status === 'inactive') {
        queryStr += ' AND u.is_active = 0';
      } else if (status === 'locked') {
        queryStr += ' AND u.account_locked_until IS NOT NULL AND u.account_locked_until > NOW()';
      }
    }
    
    if (search) {
      queryStr += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.display_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Count total users
    const countQuery = queryStr.replace(
      /SELECT u\.id.*?FROM users u/s,
      'SELECT COUNT(*) as total FROM users u'
    );
    
    const totalResult = await query(countQuery, params);
    const total = totalResult[0].total;
    
    // Add ordering and pagination
    queryStr += ` ORDER BY u.${finalSortBy} ${finalSortOrder.toUpperCase()} LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;
    
    const users = await query(queryStr, params);
    
    // Process users
    const processedUsers = users.map(user => ({
      ...user,
      is_active: Boolean(user.is_active),
      is_locked: user.account_locked_until && new Date(user.account_locked_until) > new Date(),
      post_count: include_stats === 'true' ? (user.post_count || 0) : undefined,
      published_posts: include_stats === 'true' ? (user.published_posts || 0) : undefined,
      total_views: include_stats === 'true' ? (user.total_views || 0) : undefined,
      // Don't include sensitive data
      password: undefined,
      refresh_token: undefined
    }));
    
    res.json({
      success: true,
      data: {
        users: processedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          role,
          status,
          search,
          sort_by: finalSortBy,
          sort_order: finalSortOrder,
          include_stats
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Get single user by ID (Admin only)
router.get('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    const user = await queryOne(
      `SELECT u.id, u.username, u.email, u.display_name, u.role, u.is_active, 
              u.avatar, u.bio, u.last_login, u.failed_login_attempts, u.account_locked_until,
              u.created_at, u.updated_at,
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) as post_count,
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.is_published = 1) as published_posts,
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.is_published = 0) as draft_posts,
              (SELECT SUM(p.views) FROM posts p WHERE p.author_id = u.id) as total_views,
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_posts
       FROM users u
       WHERE u.id = ?`,
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    // Get recent posts by this user
    const recentPosts = await query(
      `SELECT id, title, title_ar, slug, is_published, views, created_at
       FROM posts
       WHERE author_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        ...user,
        is_active: Boolean(user.is_active),
        is_locked: user.account_locked_until && new Date(user.account_locked_until) > new Date(),
        recent_posts: recentPosts.map(post => ({
          ...post,
          is_published: Boolean(post.is_published),
          url: `/post/${post.id}/${post.slug}`
        })),
        // Don't include sensitive data
        password: undefined,
        refresh_token: undefined
      }
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// Create new user (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      display_name,
      role = 'author',
      bio = '',
      is_active = true
    } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'username, email, and password are required'
      });
    }
    
    // Validate role
    const validRoles = ['admin', 'editor', 'author'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: `role must be one of: ${validRoles.join(', ')}`
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if username or email already exists
    const existingUser = await queryOne(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: `A user with this ${field} already exists`
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await query(
      `INSERT INTO users (
        username, email, password, display_name, role, bio, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [username, email, hashedPassword, display_name || username, role, bio, is_active ? 1 : 0]
    );
    
    const userId = result.insertId;
    
    // Fetch created user (without sensitive data)
    const createdUser = await queryOne(
      `SELECT id, username, email, display_name, role, is_active, bio, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        ...createdUser,
        is_active: Boolean(createdUser.is_active)
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// Update user (Admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Check if user exists
    const existingUser = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    const {
      username,
      email,
      display_name,
      role,
      bio,
      is_active,
      password
    } = req.body;
    
    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'editor', 'author'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `role must be one of: ${validRoles.join(', ')}`
        });
      }
    }
    
    // Check for duplicate username/email (excluding current user)
    if (username || email) {
      const duplicateCheck = await queryOne(
        'SELECT id, username, email FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username || existingUser.username, email || existingUser.email, userId]
      );
      
      if (duplicateCheck) {
        const field = duplicateCheck.username === (username || existingUser.username) ? 'username' : 'email';
        return res.status(409).json({
          success: false,
          error: 'Duplicate user data',
          message: `A user with this ${field} already exists`
        });
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (display_name !== undefined) {
      updateFields.push('display_name = ?');
      updateValues.push(display_name);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }
    
    // Handle password update
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Password must be at least 8 characters long'
        });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'Please provide at least one field to update'
      });
    }
    
    // Always update modified timestamp
    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);
    
    // Execute update
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated user (without sensitive data)
    const updatedUser = await queryOne(
      `SELECT id, username, email, display_name, role, is_active, avatar, bio, 
              last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        ...updatedUser,
        is_active: Boolean(updatedUser.is_active)
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }
    
    // Check if user exists
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    // Check if user has posts
    const postCount = await queryOne(
      'SELECT COUNT(*) as count FROM posts WHERE author_id = ?',
      [userId]
    );
    
    if (postCount.count > 0) {
      return res.status(409).json({
        success: false,
        error: 'User has posts',
        message: `Cannot delete user. They have ${postCount.count} posts. Please reassign or delete the posts first.`
      });
    }
    
    // Delete user
    await query('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// Toggle user active status (Admin only)
router.patch('/:id/toggle-status', auth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify self',
        message: 'You cannot modify your own account status'
      });
    }
    
    // Check if user exists
    const user = await queryOne('SELECT id, is_active FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    const newStatus = !user.is_active;
    
    // Update status
    await query(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus ? 1 : 0, userId]
    );
    
    res.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        user_id: userId,
        is_active: newStatus
      }
    });
    
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle user status',
      message: error.message
    });
  }
});

// Unlock user account (Admin only)
router.patch('/:id/unlock', auth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Check if user exists
    const user = await queryOne('SELECT id, account_locked_until FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    // Unlock account
    await query(
      'UPDATE users SET account_locked_until = NULL, failed_login_attempts = 0, updated_at = NOW() WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'User account unlocked successfully',
      data: {
        user_id: userId
      }
    });
    
  } catch (error) {
    console.error('Error unlocking user account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock user account',
      message: error.message
    });
  }
});

// Reset user password (Admin only)
router.patch('/:id/reset-password', auth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { new_password } = req.body;
    
    if (!new_password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'new_password is required'
      });
    }
    
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if user exists
    const user = await queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    
    // Update password
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user_id: userId
      }
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      message: error.message
    });
  }
});

// Get users statistics (Admin/Editor only)
router.get('/stats/overview', auth, requireAdminOrEditor, async (req, res) => {
  try {
    // Get overall user statistics
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_users,
        COUNT(CASE WHEN account_locked_until IS NOT NULL AND account_locked_until > NOW() THEN 1 END) as locked_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'editor' THEN 1 END) as editor_users,
        COUNT(CASE WHEN role = 'author' THEN 1 END) as author_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
        COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_users_30d
      FROM users
    `);
    
    // Get top authors by post count
    const topAuthors = await query(`
      SELECT u.id, u.username, u.display_name, u.role,
             COUNT(p.id) as post_count,
             SUM(p.views) as total_views
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id AND p.is_published = 1
      WHERE u.role IN ('author', 'editor', 'admin')
      GROUP BY u.id, u.username, u.display_name, u.role
      ORDER BY post_count DESC, total_views DESC
      LIMIT 5
    `);
    
    // Get recent registrations
    const recentRegistrations = await query(`
      SELECT id, username, display_name, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        summary: userStats[0],
        top_authors: topAuthors,
        recent_registrations: recentRegistrations
      }
    });
    
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error.message
    });
  }
});

// Bulk operations (Admin only)
router.patch('/bulk/status', auth, requireAdmin, async (req, res) => {
  try {
    const { user_ids, is_active } = req.body;
    
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'user_ids must be a non-empty array'
      });
    }
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'is_active must be a boolean'
      });
    }
    
    // Prevent admin from modifying themselves
    if (user_ids.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify self',
        message: 'You cannot modify your own account status'
      });
    }
    
    // Update user statuses
    const placeholders = user_ids.map(() => '?').join(',');
    const result = await query(
      `UPDATE users SET is_active = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [is_active ? 1 : 0, ...user_ids]
    );
    
    res.json({
      success: true,
      message: `${result.affectedRows} users ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        affected_rows: result.affectedRows,
        is_active
      }
    });
    
  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user statuses',
      message: error.message
    });
  }
});

module.exports = router;