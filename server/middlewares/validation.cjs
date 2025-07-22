const Joi = require('joi');

// Generic validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
      details: error.details
    });
  }
  
  next();
};

// User registration validation
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'editor').default('editor')
});

// User login validation
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  password: Joi.string().required(),
  remember_me: Joi.boolean().default(false)
}).or('username', 'email');

// Post creation/update validation
const postSchema = Joi.object({
  title_ar: Joi.string().min(3).max(255).required(),
  content_ar: Joi.string().min(10).required(),
  excerpt_ar: Joi.string().max(500).allow(''),
  category_id: Joi.number().integer().positive().required(),
  featured_image: Joi.string().allow(''),
  meta_description_ar: Joi.string().max(160).allow(''),
  meta_keywords_ar: Joi.string().max(255).allow(''),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  is_featured: Joi.boolean().default(false),
  is_breaking: Joi.boolean().default(false),
  scheduled_at: Joi.date().allow(null),
  tags: Joi.array().items(Joi.string()).default([])
});

// Category validation
const categorySchema = Joi.object({
  name_ar: Joi.string().min(2).max(100).required(),
  description_ar: Joi.string().max(500).allow(''),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow(''),
  sort_order: Joi.number().integer().min(0).default(0),
  is_active: Joi.boolean().default(true)
});

// Breaking news validation
const breakingNewsSchema = Joi.object({
  title_ar: Joi.string().min(3).max(255).required(),
  content_ar: Joi.string().min(10).max(1000).required(),
  link: Joi.string().uri().allow(''),
  priority: Joi.number().integer().min(1).max(10).default(1),
  is_active: Joi.boolean().default(true),
  expires_at: Joi.date().allow(null)
});

// Change password validation
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

// Social media validation
const socialMediaSchema = Joi.object({
  platform: Joi.string().min(2).max(50).required(),
  name_ar: Joi.string().min(2).max(100).required(),
  url: Joi.string().uri().required(),
  icon: Joi.string().min(2).max(50).required(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#000000'),
  sort_order: Joi.number().integer().min(0).default(0),
  is_active: Joi.boolean().default(true)
});

// Query parameter validation
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category: Joi.string().allow(''),
  search: Joi.string().allow(''),
  featured: Joi.boolean(),
  published: Joi.boolean(),
  status: Joi.string().valid('published', 'draft', 'all').default('published'),
  trending: Joi.boolean(),
  sort: Joi.string().valid('latest', 'popular', 'trending').default('latest')
});

// Validate query parameters
const validateQuery = (req, res, next) => {
  const { error, value } = querySchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      message: error.details[0].message
    });
  }
  
  req.query = value;
  next();
};

module.exports = {
  validate,
  validateQuery,
  registerSchema,
  loginSchema,
  postSchema,
  categorySchema,
  breakingNewsSchema,
  changePasswordSchema,
  socialMediaSchema,
  validateSocialMedia: validate(socialMediaSchema)
};