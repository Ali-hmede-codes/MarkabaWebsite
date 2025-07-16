const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { query, queryOne } = require('../db');
const { auth, requireAdminOrEditor } = require('../middlewares/auth');

const router = express.Router();

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / k**i).toFixed(2))} ${sizes[i]}`;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadType = req.body.upload_type || 'general';
      let uploadPath;
      
      switch (uploadType) {
        case 'post': {
          const postId = req.body.post_id;
          if (postId) {
            uploadPath = path.join(process.cwd(), 'uploads', 'posts', postId.toString(), 'images');
          } else {
            uploadPath = path.join(process.cwd(), 'uploads', 'posts', 'temp');
          }
          break;
        }
        case 'breaking_news':
          uploadPath = path.join(process.cwd(), 'uploads', 'breaking_news');
          break;
        case 'category':
          uploadPath = path.join(process.cwd(), 'uploads', 'categories');
          break;
        case 'avatar':
          uploadPath = path.join(process.cwd(), 'uploads', 'avatars');
          break;
        default:
          uploadPath = path.join(process.cwd(), 'uploads', 'general');
      }
      
      // Create directory if it doesn't exist
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()  }-${  Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  const allAllowedTypes = [...allowedTypes.image, ...allowedTypes.document];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Helper function to get file info
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created_at: stats.birthtime,
      modified_at: stats.mtime
    };
  } catch (error) {
    return null;
  }
};

// Helper function to generate file URL
const generateFileUrl = (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  return `/${relativePath.replace(/\\/g, '/')}`;
};

// Upload single file
router.post('/upload', auth, requireAdminOrEditor, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }
    
    const {
      upload_type = 'general',
      post_id,
      alt_text = '',
      caption = '',
      caption_ar = ''
    } = req.body;
    
    const fileInfo = await getFileInfo(req.file.path);
    const fileUrl = generateFileUrl(req.file.path);
    
    // Save to database
    const result = await query(
      `INSERT INTO media (
        filename, original_name, file_path, file_url, file_size, mime_type,
        upload_type, post_id, alt_text, caption, caption_ar, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.path,
        fileUrl,
        fileInfo ? fileInfo.size : 0,
        req.file.mimetype,
        upload_type,
        post_id || null,
        alt_text,
        caption,
        caption_ar,
        req.user.id
      ]
    );
    
    const mediaId = result.insertId;
    
    // Get the created media record
    const media = await queryOne(
      `SELECT m.*, u.username as uploaded_by_username
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.id = ?`,
      [mediaId]
    );
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        ...media,
        file_size_formatted: formatFileSize(media.file_size)
      }
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up file if database insert failed
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

// Upload multiple files
router.post('/upload/multiple', auth, requireAdminOrEditor, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        message: 'Please select files to upload'
      });
    }
    
    const {
      upload_type = 'general',
      post_id
    } = req.body;
    
    const uploadedFiles = [];
    const errors = [];
    
    const fileProcessingPromises = req.files.map(async (file) => {
      try {
        const fileInfo = await getFileInfo(file.path);
        const fileUrl = generateFileUrl(file.path);
        
        // Save to database
        const result = await query(
          `INSERT INTO media (
            filename, original_name, file_path, file_url, file_size, mime_type,
            upload_type, post_id, uploaded_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            file.filename,
            file.originalname,
            file.path,
            fileUrl,
            fileInfo ? fileInfo.size : 0,
            file.mimetype,
            upload_type,
            post_id || null,
            req.user.id
          ]
        );
        
        const mediaId = result.insertId;
        
        // Get the created media record
        const media = await queryOne(
          `SELECT m.*, u.username as uploaded_by_username
           FROM media m
           LEFT JOIN users u ON m.uploaded_by = u.id
           WHERE m.id = ?`,
          [mediaId]
        );
        
        return {
          success: true,
          data: {
            ...media,
            file_size_formatted: formatFileSize(media.file_size)
          }
        };
        
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        
        // Clean up file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
        
        return {
          success: false,
          filename: file.originalname,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(fileProcessingPromises);
    
    results.forEach(result => {
      if (result.success) {
        uploadedFiles.push(result.data);
      } else {
        errors.push({
          filename: result.filename,
          error: result.error
        });
      }
    });
    
    res.status(uploadedFiles.length > 0 ? 201 : 400).json({
      success: uploadedFiles.length > 0,
      message: `${uploadedFiles.length} files uploaded successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        uploaded_files: uploadedFiles,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    
    // Clean up all files
    if (req.files) {
      const cleanupPromises = req.files.map(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
      await Promise.all(cleanupPromises);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload files',
      message: error.message
    });
  }
});

// Get media files with filtering
router.get('/', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = (page - 1) * limit;
    
    const {
      upload_type,
      post_id,
      mime_type,
      search,
      uploaded_by,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    // Valid sort fields
    const validSortFields = ['created_at', 'filename', 'original_name', 'file_size', 'mime_type'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const finalSortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';
    
    let queryStr = `
      SELECT m.*, u.username as uploaded_by_username, u.display_name as uploaded_by_display_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (upload_type) {
      queryStr += ' AND m.upload_type = ?';
      params.push(upload_type);
    }
    
    if (post_id) {
      queryStr += ' AND m.post_id = ?';
      params.push(parseInt(post_id, 10));
    }
    
    if (mime_type) {
      if (mime_type === 'image') {
        queryStr += ' AND m.mime_type LIKE "image/%"';
      } else if (mime_type === 'document') {
        queryStr += ' AND m.mime_type NOT LIKE "image/%"';
      } else {
        queryStr += ' AND m.mime_type = ?';
        params.push(mime_type);
      }
    }
    
    if (search) {
      queryStr += ' AND (m.filename LIKE ? OR m.original_name LIKE ? OR m.alt_text LIKE ? OR m.caption LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (uploaded_by) {
      queryStr += ' AND m.uploaded_by = ?';
      params.push(parseInt(uploaded_by, 10));
    }
    
    if (date_from) {
      queryStr += ' AND DATE(m.created_at) >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      queryStr += ' AND DATE(m.created_at) <= ?';
      params.push(date_to);
    }
    
    // Count total files
    const countQuery = queryStr.replace(
      /SELECT m\.\*, u\.username.*?FROM media m/s,
      'SELECT COUNT(*) as total FROM media m'
    );
    
    const totalResult = await query(countQuery, params);
    const total = totalResult[0].total;
    
    // Add ordering and pagination
    queryStr += ` ORDER BY m.${finalSortBy} ${finalSortOrder.toUpperCase()} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    
    const files = await query(queryStr, params);
    
    // Process files
    const processedFiles = files.map(file => ({
      ...file,
      file_size_formatted: formatFileSize(file.file_size),
      is_image: file.mime_type.startsWith('image/'),
      thumbnail_url: file.mime_type.startsWith('image/') ? file.file_url : null
    }));
    
    res.json({
      success: true,
      data: {
        files: processedFiles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          upload_type,
          post_id,
          mime_type,
          search,
          uploaded_by,
          date_from,
          date_to,
          sort_by: finalSortBy,
          sort_order: finalSortOrder
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media files',
      message: error.message
    });
  }
});

// Get single media file
router.get('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    
    const media = await queryOne(
      `SELECT m.*, u.username as uploaded_by_username, u.display_name as uploaded_by_display_name
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.id = ?`,
      [mediaId]
    );
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found',
        message: 'The requested media file does not exist'
      });
    }
    
    // Check if file still exists on disk
    const fileExists = await getFileInfo(media.file_path);
    
    res.json({
      success: true,
      data: {
        ...media,
        file_size_formatted: formatFileSize(media.file_size),
        is_image: media.mime_type.startsWith('image/'),
        thumbnail_url: media.mime_type.startsWith('image/') ? media.file_url : null,
        file_exists: !!fileExists
      }
    });
    
  } catch (error) {
    console.error('Error fetching media file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media file',
      message: error.message
    });
  }
});

// Update media file metadata
router.put('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    
    // Check if media exists
    const existingMedia = await queryOne('SELECT * FROM media WHERE id = ?', [mediaId]);
    if (!existingMedia) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found',
        message: 'The requested media file does not exist'
      });
    }
    
    const {
      alt_text,
      caption,
      caption_ar
    } = req.body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (alt_text !== undefined) {
      updateFields.push('alt_text = ?');
      updateValues.push(alt_text);
    }
    if (caption !== undefined) {
      updateFields.push('caption = ?');
      updateValues.push(caption);
    }
    if (caption_ar !== undefined) {
      updateFields.push('caption_ar = ?');
      updateValues.push(caption_ar);
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
    updateValues.push(mediaId);
    
    // Execute update
    await query(
      `UPDATE media SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated media
    const updatedMedia = await queryOne(
      `SELECT m.*, u.username as uploaded_by_username, u.display_name as uploaded_by_display_name
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.id = ?`,
      [mediaId]
    );
    
    res.json({
      success: true,
      message: 'Media file updated successfully',
      data: {
        ...updatedMedia,
        file_size_formatted: formatFileSize(updatedMedia.file_size),
        is_image: updatedMedia.mime_type.startsWith('image/'),
        thumbnail_url: updatedMedia.mime_type.startsWith('image/') ? updatedMedia.file_url : null
      }
    });
    
  } catch (error) {
    console.error('Error updating media file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update media file',
      message: error.message
    });
  }
});

// Delete media file
router.delete('/:id', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    
    // Get media file info
    const media = await queryOne('SELECT * FROM media WHERE id = ?', [mediaId]);
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found',
        message: 'The requested media file does not exist'
      });
    }
    
    // Check if file is being used in posts
    const usageCheck = await query(
      `SELECT p.id, p.title FROM posts p 
       WHERE p.featured_image = ? OR p.content LIKE ? OR p.content_ar LIKE ?`,
      [media.file_url, `%${media.file_url}%`, `%${media.file_url}%`]
    );
    
    if (usageCheck.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'File is in use',
        message: 'Cannot delete file as it is being used in posts',
        data: {
          used_in_posts: usageCheck
        }
      });
    }
    
    // Delete from database first
    await query('DELETE FROM media WHERE id = ?', [mediaId]);
    
    // Try to delete physical file
    try {
      await fs.unlink(media.file_path);
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError.message);
      // Continue anyway as database record is deleted
    }
    
    res.json({
      success: true,
      message: 'Media file deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting media file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete media file',
      message: error.message
    });
  }
});

// Bulk delete media files
router.delete('/bulk', auth, requireAdminOrEditor, async (req, res) => {
  try {
    const { media_ids } = req.body;
    
    if (!Array.isArray(media_ids) || media_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'media_ids must be a non-empty array'
      });
    }
    
    // Get media files info
    const placeholders = media_ids.map(() => '?').join(',');
    const mediaFiles = await query(
      `SELECT * FROM media WHERE id IN (${placeholders})`,
      media_ids
    );
    
    if (mediaFiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No media files found',
        message: 'None of the specified media files exist'
      });
    }
    
    // Check if any files are being used
    const fileUrls = mediaFiles.map(f => f.file_url);
    const urlPlaceholders = fileUrls.map(() => '?').join(',');
    const likeConditions = fileUrls.map(() => 'p.content LIKE ? OR p.content_ar LIKE ?').join(' OR ');
    const likeParams = fileUrls.flatMap(url => [`%${url}%`, `%${url}%`]);
    
    const usageCheck = await query(
      `SELECT DISTINCT p.id, p.title, p.featured_image FROM posts p 
       WHERE p.featured_image IN (${urlPlaceholders}) OR ${likeConditions}`,
      [...fileUrls, ...likeParams]
    );
    
    if (usageCheck.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Files are in use',
        message: 'Cannot delete files as some are being used in posts',
        data: {
          used_in_posts: usageCheck
        }
      });
    }
    
    // Delete from database
    const result = await query(
      `DELETE FROM media WHERE id IN (${placeholders})`,
      media_ids
    );
    
    // Try to delete physical files
    const deletionPromises = mediaFiles.map(async (media) => {
      try {
        await fs.unlink(media.file_path);
        return { id: media.id, filename: media.filename, deleted: true };
      } catch (fileError) {
        console.warn(`Could not delete physical file ${media.filename}:`, fileError.message);
        return { id: media.id, filename: media.filename, deleted: false, error: fileError.message };
      }
    });
    
    const deletionResults = await Promise.all(deletionPromises);
    
    res.json({
      success: true,
      message: `${result.affectedRows} media files deleted from database`,
      data: {
        affected_rows: result.affectedRows,
        file_deletion_results: deletionResults
      }
    });
    
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete media files',
      message: error.message
    });
  }
});

// Get media statistics
router.get('/stats/overview', auth, requireAdminOrEditor, async (req, res) => {
  try {
    // Get overall statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_file_size,
        COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_files,
        COUNT(CASE WHEN mime_type NOT LIKE 'image/%' THEN 1 END) as document_files,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as recent_uploads
      FROM media
    `);
    
    // Get upload types breakdown
    const uploadTypes = await query(`
      SELECT upload_type, COUNT(*) as count, SUM(file_size) as total_size
      FROM media
      GROUP BY upload_type
      ORDER BY count DESC
    `);
    
    // Get top uploaders
    const topUploaders = await query(`
      SELECT u.username, u.display_name, COUNT(m.id) as upload_count, SUM(m.file_size) as total_size
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      GROUP BY u.id, u.username, u.display_name
      ORDER BY upload_count DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        summary: {
          ...stats[0],
          total_size_formatted: formatFileSize(stats[0].total_size || 0),
          avg_file_size_formatted: formatFileSize(stats[0].avg_file_size || 0)
        },
        upload_types: uploadTypes.map(type => ({
          ...type,
          total_size_formatted: formatFileSize(type.total_size || 0)
        })),
        top_uploaders: topUploaders.map(uploader => ({
          ...uploader,
          total_size_formatted: formatFileSize(uploader.total_size || 0)
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching media statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media statistics',
      message: error.message
    });
  }
});

module.exports = router;