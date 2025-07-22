const express = require('express');
const fs = require('fs').promises;
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { query, queryOne } = require('../db.cjs');
const { validate, postSchema } = require('../middlewares/validation.cjs');
const { auth, requireAuthorOrEditor, canEditContent, requireAdminOrEditor } = require('../middlewares/auth.cjs');
const { generateArabicSlug, calculateReadingTime, createPostFiles, deletePostFiles } = require('../utils/postUtils.cjs');



const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 728 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

async function processImage(file) {
  const uploadPath = path.join(__dirname, '../../public/uploads');
  
  try {
    await fs.mkdir(uploadPath, { recursive: true });
  } catch (err) {
    console.log("error")
  }
  
  let filename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  let filePath = path.join(uploadPath, filename);
  
  if (await fs.access(filePath).then(() => true).catch(() => false)) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const random = Math.random().toString(36).substring(2, 8);
    filename = `${base}-${random}${ext}`;
    filePath = path.join(uploadPath, filename);
  }
  
  await sharp(file.buffer).resize({ width: 1200, withoutEnlargement: true }).toFormat('jpeg', { quality: 80 }).toFile(filePath);
  
  return `/uploads/${filename}`;
}

const router = express.Router();

// Enhanced post file management functions (from posts_enhanced.js)
async function updatePostFiles(postId, postData) {
  const postDir = path.join(__dirname, '../../posts', postId.toString());
  
  try {
    // Check if post directory exists, create if not
    try {
      await fs.access(postDir);
    } catch (error) {
      await fs.mkdir(postDir, { recursive: true });
      await fs.mkdir(path.join(postDir, 'images'), { recursive: true });
    }
    
    // Update metadata
    const metadataPath = path.join(postDir, 'metadata.json');
    let existingMetadata = {};
    
    try {
      const existingData = await fs.readFile(metadataPath, 'utf8');
      existingMetadata = JSON.parse(existingData);
    } catch (err) {
      console.warn('No existing metadata found, creating new');
    }
    
    const updatedMetadata = {
      ...existingMetadata,
      ...postData,
      id: postId,
      updated_at: new Date().toISOString()
    };
    
    await fs.writeFile(
      metadataPath,
      JSON.stringify(updatedMetadata, null, 2),
      'utf8'
    );
    
    // Update content files
    if (postData.content !== undefined) {
      await fs.writeFile(
        path.join(postDir, 'content.md'),
        postData.content || '',
        'utf8'
      );
    }
    
    if (postData.content_ar !== undefined) {
      await fs.writeFile(
        path.join(postDir, 'content_ar.md'),
        postData.content_ar || '',
        'utf8'
      );
    }
    
    console.log(`Post files updated successfully for post ${postId}`);
  } catch (error) {
    console.error(`Failed to update post files for post ${postId}:`, error);
    // Don't throw error if file operations fail, just log
  }
}

// Export the function for potential future use


// GET / - Enhanced filtering system for posts - Public endpoint (NO AUTH REQUIRED)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const offset = (page - 1) * limit;
    
    // Enhanced filtering parameters
    const {
      status = 'published',
      category,
      author,
      featured,

      search,
      tags,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc',
      language, // 'ar', 'en', or 'both'
      min_reading_time,
      max_reading_time,
      min_views,
      max_views
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['created_at', 'updated_at', 'title_ar', 'views', 'reading_time'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';

    let queryStr = `
      SELECT p.*, 
             c.name_ar as category_name, 
             c.slug as category_slug,
             u.username as author_name, u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    // Apply filters
    if (status && status !== 'all') {
      if (status === 'published') {
        queryStr += ' AND p.is_published = 1';
      } else if (status === 'draft') {
        queryStr += ' AND p.is_published = 0';
      }
    }
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        queryStr += ' AND c.slug = ?';
        params.push(category);
      } else {
        queryStr += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }
    
    if (author) {
      if (Number.isNaN(Number(author))) {
        queryStr += ' AND u.username = ?';
        params.push(author);
      } else {
        queryStr += ' AND p.author_id = ?';
        params.push(parseInt(author, 10));
      }
    }
    
    if (featured !== undefined) {
      queryStr += ' AND p.is_featured = ?';
      params.push(featured === 'true' || featured === '1' ? 1 : 0);
    }
    
    if (search) {
      queryStr += ' AND (p.title_ar LIKE ? OR p.content_ar LIKE ? OR p.excerpt_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (language) {
      if (language === 'ar') {
        queryStr += ' AND (p.title_ar IS NOT NULL AND p.title_ar != "")';
      }
    }
    
    if (tags) {
      let tagArray = [];
      if (Array.isArray(tags)) {
        tagArray = tags.filter(tag => tag && tag.trim() !== '');
      } else if (typeof tags === 'string' && tags.trim() !== '') {
        tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }
      if (tagArray.length > 0) {
        const tagConditions = tagArray.map(() => 'JSON_CONTAINS(p.tags, ?)');
        queryStr += ` AND (${tagConditions.join(' OR ')})`;
        tagArray.forEach(tag => params.push(`"${tag}"`));
      }
    }
    
    if (date_from) {
      queryStr += ' AND DATE(p.created_at) >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      queryStr += ' AND DATE(p.created_at) <= ?';
      params.push(date_to);
    }
    
    if (min_reading_time) {
      queryStr += ' AND p.reading_time >= ?';
      params.push(parseInt(min_reading_time, 10));
    }
    
    if (max_reading_time) {
      queryStr += ' AND p.reading_time <= ?';
      params.push(parseInt(max_reading_time, 10));
    }
    
    if (min_views) {
      queryStr += ' AND p.views >= ?';
      params.push(parseInt(min_views, 10));
    }
    
    if (max_views) {
      queryStr += ' AND p.views <= ?';
      params.push(parseInt(max_views, 10));
    }

    if (req.query.slug) {
      queryStr += ' AND p.slug = ?';
      params.push(req.query.slug);
    }
    
    // Count total posts - Build separate count query with separate parameters
    let countQueryStr = `
      SELECT COUNT(*) as total
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;
    
    // Apply the same filters to count query with separate parameters
    if (status && status !== 'all') {
      if (status === 'published') {
        countQueryStr += ' AND p.is_published = 1';
      } else if (status === 'draft') {
        countQueryStr += ' AND p.is_published = 0';
      }
    }
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        countQueryStr += ' AND c.slug = ?';
        countParams.push(category);
      } else {
        countQueryStr += ' AND p.category_id = ?';
        countParams.push(parseInt(category, 10));
      }
    }
    
    if (author) {
      if (Number.isNaN(Number(author))) {
        countQueryStr += ' AND u.username = ?';
        countParams.push(author);
      } else {
        countQueryStr += ' AND p.author_id = ?';
        countParams.push(parseInt(author, 10));
      }
    }
    
    if (featured !== undefined) {
      countQueryStr += ' AND p.is_featured = ?';
      countParams.push(featured === 'true' || featured === '1' ? 1 : 0);
    }
    
    if (search) {
      countQueryStr += ' AND (p.title_ar LIKE ? OR p.content_ar LIKE ? OR p.excerpt_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (language) {
      if (language === 'ar') {
        countQueryStr += ' AND (p.title_ar IS NOT NULL AND p.title_ar != "")';
      }
    }
    
    if (tags) {
      let tagArray = [];
      if (Array.isArray(tags)) {
        tagArray = tags.filter(tag => tag && tag.trim() !== '');
      } else if (typeof tags === 'string' && tags.trim() !== '') {
        tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }
      if (tagArray.length > 0) {
        const tagConditions = tagArray.map(() => 'JSON_CONTAINS(p.tags, ?)');
        countQueryStr += ` AND (${tagConditions.join(' OR ')})`;
        tagArray.forEach(tag => countParams.push(`"${tag}"`));
      }
    }
    
    if (date_from) {
      countQueryStr += ' AND DATE(p.created_at) >= ?';
      countParams.push(date_from);
    }
    
    if (date_to) {
      countQueryStr += ' AND DATE(p.created_at) <= ?';
      countParams.push(date_to);
    }
    
    if (min_reading_time) {
      countQueryStr += ' AND p.reading_time >= ?';
      countParams.push(parseInt(min_reading_time, 10));
    }
    
    if (max_reading_time) {
      countQueryStr += ' AND p.reading_time <= ?';
      countParams.push(parseInt(max_reading_time, 10));
    }
    
    if (min_views) {
      countQueryStr += ' AND p.views >= ?';
      countParams.push(parseInt(min_views, 10));
    }
    
    if (max_views) {
      countQueryStr += ' AND p.views <= ?';
      countParams.push(parseInt(max_views, 10));
    }

    if (req.query.slug) {
      countQueryStr += ' AND p.slug = ?';
      countParams.push(req.query.slug);
    }
    
    const totalResult = await query(countQueryStr, countParams);
    const total = totalResult[0].total;
    
    // Add ordering and pagination
    queryStr += ` ORDER BY p.${finalSortBy} ${finalSortOrder.toUpperCase()} LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;
    
    const posts = await query(queryStr, params);
    
    // Parse JSON fields and process posts
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published),
      url: `/post/${post.id}/${post.slug}`
    }));
    
    res.json({
      success: true,
      data: {
        posts: processedPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          status,
          category,
          author,
          featured,
          search,
          tags,
          date_from,
          date_to,
          language,
          sort_by: finalSortBy,
          sort_order: finalSortOrder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      message: error.message
    });
  }
});

// GET /featured - Get featured posts
router.get('/featured', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const { category, language } = req.query;
    
    let queryStr = `
      SELECT p.*, 
             c.name_ar as category_name, 
             c.name_ar as category_name_ar, 
             c.slug as category_slug,
             u.username as author_name, u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.is_published = 1 AND p.is_featured = 1
    `;
    
    const params = [];
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        queryStr += ' AND c.slug = ?';
        params.push(category);
      } else {
        queryStr += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }
    
    if (language) {
      if (language === 'ar') {
        queryStr += ' AND (p.title_ar IS NOT NULL AND p.title_ar != "")';
      }
      // Note: Only Arabic language is supported in this schema
    }
    
    queryStr += ' ORDER BY p.created_at DESC LIMIT ?';
    params.push(limit);
    
    const posts = await query(queryStr, params);
    
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published),
      url: `/post/${post.id}/${post.slug}`
    }));
    
    res.json({
      success: true,
      data: processedPosts
    });
    
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured posts',
      message: error.message
    });
  }
});

// GET /trending - Get trending posts
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);
    const days = Math.min(parseInt(req.query.days, 10) || 7, 30);
    const { category, language } = req.query;
    
    let queryStr = `
      SELECT p.*, 
             c.name_ar as category_name, 
             c.name_ar as category_name_ar, 
             c.slug as category_slug,
             u.username as author_name, u.display_name as author_display_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.is_published = 1 AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const params = [days];
    
    if (category) {
      if (Number.isNaN(Number(category))) {
        queryStr += ' AND c.slug = ?';
        params.push(category);
      } else {
        queryStr += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }
    
    if (language) {
      if (language === 'ar') {
        queryStr += ' AND (p.title_ar IS NOT NULL AND p.title_ar != "")';
      }
      // Note: Only Arabic language is supported in this schema
    }

    queryStr += ' ORDER BY p.views DESC, p.created_at DESC LIMIT ?';
    params.push(limit);
    
    const posts = await query(queryStr, params);
    
    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      is_featured: Boolean(post.is_featured),
      is_published: Boolean(post.is_published),
      url: `/post/${post.id}/${post.slug}`
    }));
    
    res.json({
      success: true,
      data: processedPosts
    });
    
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending posts',
      message: error.message
    });
  }
});

// GET /:id/:slug - Get single post by ID and slug with enhanced Arabic support
router.get('/:id/:slug', async (req, res) => {
  try {
    const { id, slug } = req.params;
    const { include_related = 'true', track_view = 'true' } = req.query;
    
    // Get the main post
    const post = await queryOne(
      `SELECT p.*, 
              c.name_ar as category_name, 
              c.name_ar as category_name_ar, 
              c.slug as category_slug, c.color as category_color,
              u.username as author_name, u.display_name as author_display_name,
              u.avatar as author_avatar, u.bio as author_bio
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ? AND p.slug = ? AND p.is_published = 1`,
      [id, slug]
    );
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
        message: 'The requested post does not exist'
      });
    }
    
    // Parse JSON fields
    post.tags = post.tags ? JSON.parse(post.tags) : [];
    post.is_featured = Boolean(post.is_featured);
    post.is_published = Boolean(post.is_published);
    
    // Track view if requested
    if (track_view === 'true') {
      await query('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);
      post.views += 1;
    }
    
    // Try to load content from files if available
    try {
      const postDir = path.join(__dirname, '../../posts', id.toString());
      
      try {
        const contentPath = path.join(postDir, 'content.md');
        const fileContent = await fs.readFile(contentPath, 'utf8');
        if (fileContent) post.content = fileContent;
      } catch (err) {
        // File doesn't exist, use database content
      }
      
      try {
        const contentArPath = path.join(postDir, 'content_ar.md');
        const fileContentAr = await fs.readFile(contentArPath, 'utf8');
        if (fileContentAr) post.content_ar = fileContentAr;
      } catch (err) {
        // File doesn't exist, use database content
      }
    } catch (err) {
      // Post directory doesn't exist, use database content
    }
    
    // Get related posts if requested
    let relatedPosts = [];
    if (include_related === 'true') {
      relatedPosts = await query(
        `SELECT p.id, p.title_ar, p.slug, p.excerpt_ar,
                p.featured_image, p.views, p.reading_time, p.created_at,
                c.name_ar as category_name, 
                c.name_ar as category_name_ar, 
                c.slug as category_slug
         FROM posts p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id != ? AND p.is_published = 1 AND (
           p.category_id = ? OR 
           JSON_OVERLAPS(p.tags, ?)
         )
         ORDER BY (
           CASE WHEN p.category_id = ? THEN 3 ELSE 0 END +
           CASE WHEN JSON_OVERLAPS(p.tags, ?) THEN 2 ELSE 0 END
         ) DESC, p.views DESC, p.created_at DESC
         LIMIT 5`,
        [
          post.id, 
          post.category_id, 
          JSON.stringify(post.tags),
          post.category_id,
          JSON.stringify(post.tags)
        ]
      );
      
      relatedPosts = relatedPosts.map(rp => ({
        ...rp,
        is_featured: Boolean(rp.is_featured),
        url: `/post/${rp.id}/${rp.slug}`
      }));
    }
    
    // Structure the response
    const response = {
      success: true,
      data: {
        ...post,
        category: {
          id: post.category_id,
          name: post.category_name,
          name_ar: post.category_name_ar,
          slug: post.category_slug,
          color: post.category_color
        },
        author: {
          id: post.author_id,
          username: post.author_name,
          display_name: post.author_display_name,
          avatar: post.author_avatar,
          bio: post.author_bio
        },
        url: `/post/${post.id}/${post.slug}`
      }
    };
    
    // Remove redundant fields
    delete response.data.category_id;
    delete response.data.category_name;
    delete response.data.category_name_ar;
    delete response.data.category_slug;
    delete response.data.category_color;
    delete response.data.author_id;
    delete response.data.author_name;
    delete response.data.author_display_name;
    delete response.data.author_avatar;
    delete response.data.author_bio;
    
    if (include_related === 'true') {
      response.data.related_posts = relatedPosts;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Post fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch post'
    });
  }
});

// POST / - Create new post with enhanced Arabic support
router.post('/', auth, requireAuthorOrEditor, upload.single('featured_image'), validate(postSchema), async (req, res) => {
  try {
    const {
      title_ar,
      content_ar,
      excerpt_ar,
      category_id,
      tags = [],
      meta_description_ar,
      meta_keywords_ar,
      is_featured = false,
      is_published = false
    } = req.body;
    
    let featured_image = req.body.featured_image;
    if (req.file) {
      featured_image = await processImage(req.file);
    }
    
    // Validate required fields
    if (!title_ar) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'title_ar is required'
      });
    }
    
    if (!content_ar) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'content_ar is required'
      });
    }
    
    // Verify category exists
    const category = await queryOne('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid category ID'
      });
    }
    
    // Generate slug from Arabic title
    const baseSlug = generateArabicSlug(title_ar);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug uniqueness
    const checkSlugUniqueness = async () => {
      const existingPost = await queryOne('SELECT id FROM posts WHERE slug = ?', [slug]);
      if (existingPost) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
        return checkSlugUniqueness();
      }
      return slug;
    };
    
    await checkSlugUniqueness();
    
    // Calculate reading time
    const reading_time = calculateReadingTime(content_ar);
    
    // Only admins and editors can publish directly
    let finalIsPublished = is_published;
    if (req.user.role === 'author' && is_published) {
      finalIsPublished = false; // Authors can only create drafts
    }
    
    // Insert post into database
    const result = await query(
      `INSERT INTO posts (
        title_ar, content_ar, excerpt_ar,
        slug, category_id, author_id, featured_image, tags,
        meta_description_ar, meta_keywords_ar, reading_time,
        is_featured, is_published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title_ar, content_ar, excerpt_ar,
        slug, category_id, req.user.id, featured_image, JSON.stringify(tags),
        meta_description_ar, meta_keywords_ar, reading_time,
        is_featured ? 1 : 0, finalIsPublished ? 1 : 0
      ]
    );
    
    const postId = result.insertId;
    
    // Create post files if published
    if (finalIsPublished) {
      try {
        await createPostFiles(postId, {
          title_ar, content_ar, excerpt_ar,
          slug, category_id, author_id: req.user.id, featured_image,
          tags, meta_description_ar, meta_keywords_ar, reading_time,
          is_featured, is_published: finalIsPublished
        });
      } catch (fileError) {
        console.error('Failed to create post files:', fileError);
        // Continue without failing the request
      }
    }
    
    // Fetch the created post with related data
    const createdPost = await queryOne(
      `SELECT p.*, c.name as category_name, c.name_ar as category_name_ar,
              u.username as author_name, u.display_name as author_display_name
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [postId]
    );
    
    // Process the response
    createdPost.tags = JSON.parse(createdPost.tags || '[]');
    createdPost.is_featured = Boolean(createdPost.is_featured);
    createdPost.is_published = Boolean(createdPost.is_published);
    createdPost.url = `/post/${createdPost.id}/${createdPost.slug}`;
    
    res.status(201).json({
      success: true,
      message: finalIsPublished ? 'Post created and published successfully' : 'Post created as draft successfully',
      data: createdPost
    });
    
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
      message: error.message
    });
  }
});

// PUT /:id - Update post with enhanced features
router.put('/:id', auth, canEditContent, validate(postSchema), async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    
    // Check if post exists
    const existingPost = await queryOne('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
        message: 'The requested post does not exist'
      });
    }
    
    const {
      title_ar,
      content_ar,
      excerpt_ar,
      category_id,
      featured_image,
      tags,
      meta_description_ar,
      meta_keywords_ar,
      is_featured,
      is_published
    } = req.body;
    
    // Verify category if provided
    if (category_id) {
      const category = await queryOne('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid category ID'
        });
      }
    }
    
    // Handle slug regeneration if title changed
    let slug = existingPost.slug;
    if (title_ar && title_ar !== existingPost.title_ar) {
      const baseSlug = generateArabicSlug(title_ar);
      slug = baseSlug;
      let counter = 1;
      
      // Ensure slug uniqueness (excluding current post)
      const checkSlugUniquenessForUpdate = async () => {
        const existingSlugPost = await queryOne('SELECT id FROM posts WHERE slug = ? AND id != ?', [slug, postId]);
        if (existingSlugPost) {
          slug = `${baseSlug}-${counter}`;
          counter += 1;
          return checkSlugUniquenessForUpdate();
        }
        return slug;
      };
      
      await checkSlugUniquenessForUpdate();
    }
    
    // Recalculate reading time if content changed
    let reading_time = existingPost.reading_time;
    if (content_ar !== undefined) {
      reading_time = calculateReadingTime(content_ar);
    }
    
    // Handle publishing permissions
    let finalIsPublished = is_published !== undefined ? is_published : existingPost.is_published;
    if (req.user.role === 'author' && is_published && !existingPost.is_published) {
      // Authors can only set to pending for review, not directly publish
      finalIsPublished = false;
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (title_ar !== undefined) {
      updateFields.push('title_ar = ?');
      updateValues.push(title_ar);
    }
    if (content_ar !== undefined) {
      updateFields.push('content_ar = ?');
      updateValues.push(content_ar);
    }
    if (excerpt_ar !== undefined) {
      updateFields.push('excerpt_ar = ?');
      updateValues.push(excerpt_ar);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }
    if (featured_image !== undefined) {
      updateFields.push('featured_image = ?');
      updateValues.push(featured_image);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(tags));
    }
    if (meta_description_ar !== undefined) {
      updateFields.push('meta_description_ar = ?');
      updateValues.push(meta_description_ar);
    }
    if (meta_keywords_ar !== undefined) {
      updateFields.push('meta_keywords_ar = ?');
      updateValues.push(meta_keywords_ar);
    }
    if (is_featured !== undefined) {
      updateFields.push('is_featured = ?');
      updateValues.push(is_featured ? 1 : 0);
    }
    
    // Always update these fields
    updateFields.push('slug = ?', 'reading_time = ?', 'is_published = ?', 'updated_at = NOW()');
    updateValues.push(slug, reading_time, finalIsPublished ? 1 : 0);
    
    // Add post ID for WHERE clause
    updateValues.push(postId);
    
    // Execute update
    await query(
      `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Update post files if published
    if (finalIsPublished) {
      try {
        const updateData = {
          title_ar: title_ar !== undefined ? title_ar : existingPost.title_ar,
          content_ar: content_ar !== undefined ? content_ar : existingPost.content_ar,
          excerpt_ar: excerpt_ar !== undefined ? excerpt_ar : existingPost.excerpt_ar,
          slug,
          category_id: category_id !== undefined ? category_id : existingPost.category_id,
          featured_image: featured_image !== undefined ? featured_image : existingPost.featured_image,
          tags: tags !== undefined ? tags : JSON.parse(existingPost.tags || '[]'),
          meta_description_ar: meta_description_ar !== undefined ? meta_description_ar : existingPost.meta_description_ar,
          meta_keywords_ar: meta_keywords_ar !== undefined ? meta_keywords_ar : existingPost.meta_keywords_ar,
          reading_time,
          is_featured: is_featured !== undefined ? is_featured : Boolean(existingPost.is_featured),
          is_published: finalIsPublished
        };
        
        await createPostFiles(postId, updateData);
      } catch (fileError) {
        console.error('Failed to update post files:', fileError);
        // Continue without failing the request
      }
    } else if (existingPost.is_published && !finalIsPublished) {
      // Post was unpublished, remove files
      try {
        await deletePostFiles(postId);
      } catch (fileError) {
        console.error('Failed to delete post files:', fileError);
      }
    }
    
    // Fetch updated post
    const updatedPost = await queryOne(
      `SELECT p.*, c.name as category_name, c.name_ar as category_name_ar,
              u.username as author_name, u.display_name as author_display_name
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [postId]
    );
    
    // Process response
    updatedPost.tags = JSON.parse(updatedPost.tags || '[]');
    updatedPost.is_featured = Boolean(updatedPost.is_featured);
    updatedPost.is_published = Boolean(updatedPost.is_published);
    updatedPost.url = `/post/${updatedPost.id}/${updatedPost.slug}`;
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });
    
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post',
      message: error.message
    });
  }
});

// DELETE /:id - Delete post
router.delete('/:id', auth, canEditContent, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    
    // Check if post exists
    const post = await queryOne('SELECT id, title_ar, featured_image FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
        message: 'The requested post does not exist'
      });
    }
    
    // Delete from database
    await query('DELETE FROM posts WHERE id = ?', [postId]);
    
    // Delete post files
    try {
      await deletePostFiles(postId);
    } catch (fileError) {
      console.error('Failed to delete post files:', fileError);
      // Continue without failing the request
    }
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
      message: error.message
    });
  }
});

// PATCH /bulk/status - Bulk operations for posts
router.patch('/bulk/status', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const { post_ids, status } = req.body;
    
    if (!Array.isArray(post_ids) || post_ids.length === 0 || post_ids.some(id => typeof id !== 'number' && (typeof id !== 'string' || id.trim() === '' || Number.isNaN(Number(id))))) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'post_ids must be a non-empty array of valid numbers'
      });
    }
    
    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Status must be either "published" or "draft"'
      });
    }
    
    const isPublished = status === 'published' ? 1 : 0;
    const placeholders = post_ids.map(() => '?').join(',');
    
    // Update posts
    const result = await query(
      `UPDATE posts SET is_published = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [isPublished, ...post_ids]
    );
    
    // Handle file operations for affected posts
    if (isPublished) {
      // Create files for newly published posts
      const posts = await query(
        `SELECT id, title_ar, content_ar, excerpt_ar, slug, featured_image, category_id, author_id, is_published, is_featured, meta_description_ar, tags, created_at, updated_at FROM posts WHERE id IN (${placeholders})`,
        post_ids
      );
      
      await Promise.all(posts.map(async (post) => {
        try {
          await createPostFiles(post.id, {
            ...post,
            tags: JSON.parse(post.tags || '[]'),
            is_featured: Boolean(post.is_featured),
            is_published: true
          });
        } catch (fileError) {
          console.error(`Failed to create files for post ${post.id}:`, fileError);
        }
      }));
    } else {
      // Delete files for unpublished posts
      await Promise.all(post_ids.map(async (postId) => {
        try {
          await deletePostFiles(postId);
        } catch (fileError) {
          console.error(`Failed to delete files for post ${postId}:`, fileError);
        }
      }));
    }
    
    res.json({
      success: true,
      message: `${result.affectedRows} posts updated to ${status}`,
      data: {
        affected_rows: result.affectedRows,
        status
      }
    });
    
  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update posts',
      message: error.message
    });
  }
});

// DELETE /bulk - Bulk delete posts
router.delete('/bulk', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const { post_ids } = req.body;
    
    if (!Array.isArray(post_ids) || post_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'post_ids must be a non-empty array'
      });
    }
    
    const placeholders = post_ids.map(() => '?').join(',');
    
    // Delete posts from database
    const result = await query(
      `DELETE FROM posts WHERE id IN (${placeholders})`,
      post_ids
    );
    
    // Delete post files
    await Promise.all(post_ids.map(async (postId) => {
      try {
        await deletePostFiles(postId);
      } catch (fileError) {
        console.error(`Failed to delete files for post ${postId}:`, fileError);
      }
    }));
    
    res.json({
      success: true,
      message: `${result.affectedRows} posts deleted successfully`,
      data: {
        affected_rows: result.affectedRows
      }
    });
    
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete posts',
      message: error.message
    });
  }
});

module.exports = router;