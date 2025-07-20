const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, queryOne } = require('../db');
const { validate, loginSchema, registerSchema, changePasswordSchema } = require('../middlewares/validation');
const { auth, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Enhanced security configurations
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
const ADMIN_MIN_PASSWORD_LENGTH = 8;
const ADMIN_REQUIRE_COMPLEX_PASSWORD = true;



// Password complexity check
const isPasswordComplex = (password) => {
  if (!ADMIN_REQUIRE_COMPLEX_PASSWORD) return true;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= ADMIN_MIN_PASSWORD_LENGTH && 
         hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};



// Generate secure tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    is_active: user.is_active
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = crypto.randomBytes(64).toString('hex');
  
  return { accessToken, refreshToken };
};

// Enhanced login with security features
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { username, email, password, remember_me = false } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    

    
    // Validate input - require either username or email
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Either username or email is required'
      });
    }
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Password is required'
      });
    }
    
    // Enhanced password validation for admin users
    if (password.length < ADMIN_MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: `Password must be at least ${ADMIN_MIN_PASSWORD_LENGTH} characters long`
      });
    }
    
    // Find user by username or email
    let user;
    if (email) {
      user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    } else {
      user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
    }
    
    if (!user) {
      // Log failed login attempt
      console.log(`Failed login attempt - User not found: ${username || email} from IP: ${clientIP}`);
      
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact an administrator.'
      });
    }
    
    
    
    // Additional security check for admin users
    if (user.role !== 'admin') {
      console.log(`Non-admin user attempted admin login: ${user.username || user.email}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Log failed login attempt
      console.log(`Failed admin login attempt: ${user.username} from IP: ${clientIP}`);
      
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }
    
    // Check if admin password meets complexity requirements
    if (!isPasswordComplex(password)) {
      console.log(`Admin user with weak password: ${user.username || user.email}`);
      return res.status(400).json({
        success: false,
        error: 'Password security',
        message: 'Password must contain uppercase, lowercase, numbers, and special characters'
      });
    }
    
    // Successful login - generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    const expiresIn = remember_me ? REFRESH_TOKEN_EXPIRES_IN : JWT_EXPIRES_IN;
    
    // Update user login info
    await query(
      `UPDATE users SET 
        last_login = NOW(), 
        last_login_ip = ?,
        refresh_token = ?,
        refresh_token_expires = DATE_ADD(NOW(), INTERVAL ? DAY),
        updated_at = NOW()
       WHERE id = ?`,
      [
        clientIP,
        refreshToken,
        remember_me ? 30 : 7, // 30 days if remember_me, otherwise 7 days
        user.id
      ]
    );
    
    // Enhanced logging for admin login
    console.log(`ADMIN LOGIN SUCCESS: ${user.username || user.email} from IP: ${clientIP} | User-Agent: ${userAgent} | Time: ${new Date().toISOString()}`);
    
    // Prepare response data with additional security information
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      is_active: Boolean(user.is_active),
      created_at: user.created_at,
      last_login: new Date().toISOString(),
      login_ip: clientIP,
      session_expires: remember_me ? '30 days' : '7 days'
    };
    
    // Set secure HTTP-only cookie for refresh token with enhanced security for admin
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: remember_me ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000 // 7 days or 2 hours for admin
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token: accessToken,
        access_token: accessToken,
        expires_in: expiresIn,
        token_type: 'Bearer'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
});

// Enhanced user registration (Admin only)
router.post('/register', auth, requireAdmin, validate(registerSchema), async (req, res) => {
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
    
    // Validate role
    const validRoles = ['admin', 'editor', 'author'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid role. Must be admin, editor, or author'
      });
    }
    
    // Check if username already exists
    const existingUsername = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Username already exists'
      });
    }
    
    // Check if email already exists
    const existingEmail = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email already exists'
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
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await query(
      `INSERT INTO users (
        username, email, password, display_name, role, bio, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [username, email, hashedPassword, display_name, role, bio, is_active ? 1 : 0]
    );
    
    const userId = result.insertId;
    
    // Fetch created user (without password)
    const newUser = await queryOne(
      'SELECT id, username, email, display_name, role, bio, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    // Log user creation
    console.log(`New user created: ${username} (${role}) by admin: ${req.user.username}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        ...newUser,
        is_active: Boolean(newUser.is_active)
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during registration'
    });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Refresh token is required'
      });
    }
    
    // Find user with this refresh token
    const user = await queryOne(
      'SELECT * FROM users WHERE refresh_token = ? AND refresh_token_expires > NOW() AND is_active = 1',
      [refreshToken]
    );
    
    if (!user) {
      // Clear invalid refresh token cookie
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Refresh token is invalid or expired'
      });
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Update refresh token in database
    await query(
      'UPDATE users SET refresh_token = ?, refresh_token_expires = DATE_ADD(NOW(), INTERVAL 30 DAY), updated_at = NOW() WHERE id = ?',
      [newRefreshToken, user.id]
    );
    
    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        access_token: accessToken,
        expires_in: JWT_EXPIRES_IN,
        token_type: 'Bearer'
      }
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during token refresh'
    });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Clear refresh token from database
    await query(
      'UPDATE users SET refresh_token = NULL, refresh_token_expires = NULL, updated_at = NOW() WHERE id = ?',
      [req.user.id]
    );
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    // Log logout
    console.log(`User logged out: ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during logout'
    });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT id, username, email, display_name, role, avatar, bio, is_active, 
              created_at, last_login, last_login_ip
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...user,
        is_active: Boolean(user.is_active)
      }
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      display_name,
      bio,
      avatar
    } = req.body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (display_name !== undefined) {
      updateFields.push('display_name = ?');
      updateValues.push(display_name);
    }
    
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'No fields to update'
      });
    }
    
    // Always update timestamp
    updateFields.push('updated_at = NOW()');
    updateValues.push(req.user.id);
    
    // Execute update
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated user
    const updatedUser = await queryOne(
      `SELECT id, username, email, display_name, role, avatar, bio, is_active, 
              created_at, last_login, updated_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...updatedUser,
        is_active: Boolean(updatedUser.is_active)
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating profile'
    });
  }
});

// Change password
router.put('/change-password', auth, validate(changePasswordSchema), async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    
    // Validate new password confirmation
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'New password and confirmation do not match'
      });
    }
    
    // Validate new password strength
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'New password must be at least 8 characters long'
      });
    }
    
    // Get current user with password
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);
    
    // Update password
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );
    
    // Log password change
    console.log(`Password changed for user: ${user.username}`);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while changing password'
    });
  }
});

// Verify token (for middleware testing)
router.get('/verify', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        is_active: req.user.is_active
      }
    }
  });
});

// Get user permissions (for frontend role checking)
router.get('/permissions', auth, (req, res) => {
  const permissions = {
    admin: {
      can_manage_users: true,
      can_manage_posts: true,
      can_manage_categories: true,
      can_manage_breaking_news: true,
      can_manage_settings: true,
      can_view_analytics: true,
      can_publish_posts: true,
      can_edit_all_posts: true
    },
    editor: {
      can_manage_users: false,
      can_manage_posts: true,
      can_manage_categories: true,
      can_manage_breaking_news: true,
      can_manage_settings: false,
      can_view_analytics: true,
      can_publish_posts: true,
      can_edit_all_posts: true
    },
    author: {
      can_manage_users: false,
      can_manage_posts: false,
      can_manage_categories: false,
      can_manage_breaking_news: false,
      can_manage_settings: false,
      can_view_analytics: false,
      can_publish_posts: false,
      can_edit_all_posts: false
    }
  };
  
  res.json({
    success: true,
    data: {
      role: req.user.role,
      permissions: permissions[req.user.role] || permissions.author
    }
  });
});

module.exports = router;