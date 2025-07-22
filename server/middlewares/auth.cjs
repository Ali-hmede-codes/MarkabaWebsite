const jwt = require('jsonwebtoken');
const { queryOne, query } = require('../db.cjs');

// Enhanced authentication middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne(
      'SELECT id, username, email, display_name, avatar, role, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.id]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user account deactivated.'
      });
    }
    
    // Update last login timestamp
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Role-based access control
const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
    });
  }
  
  next();
};

// Specific role middlewares for convenience
const requireAdmin = requireRole(['admin']);
const requireAuthor = requireRole(['admin', 'author']);
const requireEditor = requireRole(['admin', 'editor']);
const requireAuthorOrEditor = requireRole(['admin', 'author', 'editor']);
const requireAdminOrEditor = requireRole(['admin', 'editor']);

// Permission-based middleware
const requirePermission = (permission) => (req, res, next) => {
  const userRole = req.user ? req.user.role : undefined;
  
  const permissions = {
    admin: [
      'create_post', 'edit_post', 'delete_post', 'publish_post',
      'create_category', 'edit_category', 'delete_category',
      'manage_users', 'manage_breaking_news', 'manage_settings',
      'view_dashboard', 'moderate_content'
    ],
    editor: [
      'create_post', 'edit_post', 'delete_post', 'publish_post',
      'create_category', 'edit_category',
      'manage_breaking_news', 'view_dashboard', 'moderate_content'
    ],
    author: [
      'create_post', 'edit_own_post', 'delete_own_post',
      'view_dashboard'
    ]
  };
  
  const userPermissions = permissions[userRole] || [];
  
  if (!userPermissions.includes(permission)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Permission '${permission}' required.`
    });
  }
  
  next();
};

// Check if user can edit specific content
const canEditContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // Admins and editors can edit any content
    if (['admin', 'editor'].includes(userRole)) {
      return next();
    }
    
    // Authors can only edit their own content
    if (userRole === 'author') {
      const content = await queryOne(
        'SELECT author_id FROM posts WHERE id = ?',
        [id]
      );
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found.'
        });
      }
      
      if (content.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own content.'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Content permission check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking content permissions.'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne(
      'SELECT id, username, email, display_name, avatar, role, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.id]
    );
    
    if (user) {
      req.user = user;
      // Update last login timestamp
      await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

// Legacy middleware for backward compatibility
const verifyToken = auth;

module.exports = {
  auth,
  optionalAuth,
  verifyToken, // Legacy support
  requireRole,
  requireAdmin,
  requireAuthor,
  requireEditor,
  requireAuthorOrEditor,
  requireAdminOrEditor,
  requirePermission,
  canEditContent
};