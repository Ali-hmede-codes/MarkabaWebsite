const express = require('express');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const db = require('../../config/database.cjs');
const { auth: authenticateToken, requireRole } = require('../../middlewares/auth.cjs');


const router = express.Router();

// Get all settings
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [settings] = await db.execute(
      'SELECT setting_key, setting_value, setting_type FROM settings ORDER BY setting_key'
    );
    
    // Group settings by category
    const groupedSettings = {};
    settings.forEach(setting => {
      const parts = setting.setting_key.split('_', 2);
      const category = parts[0] || 'general';
      const key = parts[1] || parts[0];
      if (!groupedSettings[category]) {
        groupedSettings[category] = {};
      }
      
      let value = setting.setting_value;
      // Parse JSON values
      if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = {};
        }
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value, 10) || 0;
      }
      
      groupedSettings[category][key] = value;
    });
    
    res.json({
      success: true,
      data: groupedSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Get settings by category
router.get('/:category', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { category } = req.params;
    
    const [settings] = await db.execute(
      'SELECT setting_key, setting_value, setting_type FROM settings WHERE setting_key LIKE ? ORDER BY setting_key',
      [`${category}_%`]
    );
    
    const categorySettings = {};
    settings.forEach(setting => {
      const key = setting.setting_key.replace(`${category}_`, '');
      let value = setting.setting_value;
      
      // Parse values based on type
      if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = {};
        }
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value) || 0;
      }
      
      categorySettings[key] = value;
    });
    
    res.json({
      success: true,
      data: categorySettings
    });
  } catch (error) {
    console.error('Error fetching category settings:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Update settings
router.put('/',
  authenticateToken,
  requireRole(['admin']),
  [
    body('settings')
      .isObject()
      .withMessage('الإعدادات يجب أن تكون كائن'),
    body('category')
      .optional()
      .isString()
      .withMessage('الفئة يجب أن تكون نص')
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

      const { settings, category } = req.body;
      
      // Start transaction
      await db.execute('START TRANSACTION');
      
      try {
        const settingsEntries = Object.entries(settings);
        const settingsPromises = settingsEntries.map(async ([key, value]) => {
          const settingKey = category ? `${category}_${key}` : key;
          
          // Determine setting type and format value
          let settingType = 'string';
          let settingValue = value;
          
          if (typeof value === 'boolean') {
            settingType = 'boolean';
            settingValue = value.toString();
          } else if (typeof value === 'number') {
            settingType = 'number';
            settingValue = value.toString();
          } else if (typeof value === 'object') {
            settingType = 'json';
            settingValue = JSON.stringify(value);
          }
          
          // Insert or update setting
          return db.execute(
            `INSERT INTO settings (setting_key, setting_value, setting_type, updated_at) 
             VALUES (?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
             setting_value = VALUES(setting_value), 
             setting_type = VALUES(setting_type), 
             updated_at = NOW()`,
            [settingKey, settingValue, settingType]
          );
        });
        
        await Promise.all(settingsPromises);
        
        // Commit transaction
        await db.execute('COMMIT');
        
        res.json({
          success: true,
          message: 'تم حفظ الإعدادات بنجاح'
        });
      } catch (error) {
        // Rollback transaction
        await db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Update single setting
router.put('/:key',
  authenticateToken,
  requireRole(['admin']),
  [
    body('value')
      .exists()
      .withMessage('القيمة مطلوبة'),
    body('type')
      .optional()
      .isIn(['string', 'number', 'boolean', 'json'])
      .withMessage('نوع الإعداد غير صحيح')
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

      const { key } = req.params;
      const { value } = req.body;
      let { type } = req.body;
      
      // Auto-detect type if not provided
      if (!type) {
        if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (typeof value === 'number') {
          type = 'number';
        } else if (typeof value === 'object') {
          type = 'json';
        } else {
          type = 'string';
        }
      }
      
      // Format value based on type
      let settingValue = value;
      if (type === 'json') {
        settingValue = JSON.stringify(value);
      } else {
        settingValue = value.toString();
      }
      
      // Insert or update setting
      await db.execute(
        `INSERT INTO settings (setting_key, setting_value, setting_type, updated_at) 
         VALUES (?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value), 
         setting_type = VALUES(setting_type), 
         updated_at = NOW()`,
        [key, settingValue, type]
      );
      
      res.json({
        success: true,
        message: 'تم حفظ الإعداد بنجاح'
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Delete setting
router.delete('/:key',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { key } = req.params;
      
      const [result] = await db.execute(
        'DELETE FROM settings WHERE setting_key = ?',
        [key]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإعداد غير موجود'
        });
      }
      
      res.json({
        success: true,
        message: 'تم حذف الإعداد بنجاح'
      });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم الداخلي'
      });
    }
  }
);

// Test email settings
router.post('/test-email',
  authenticateToken,
  requireRole(['admin']),
  [
    body('to')
      .isEmail()
      .withMessage('البريد الإلكتروني غير صحيح'),
    body('subject')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('الموضوع يجب أن يكون بين 1 و 200 حرف'),
    body('message')
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('الرسالة يجب أن تكون بين 1 و 1000 حرف')
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

      const { to, subject = 'اختبار البريد الإلكتروني', message = 'هذه رسالة اختبار من نظام نيوز مركبة.' } = req.body;
      
      // Get email settings
      const [emailSettings] = await db.execute(
        'SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE "email_%"'
      );
      
      const settings = {};
      emailSettings.forEach(setting => {
        const key = setting.setting_key.replace('email_', '');
        settings[key] = setting.setting_value;
      });
      
      // Check if email settings are configured
      if (!settings.host || !settings.port || !settings.username || !settings.password) {
        return res.status(400).json({
          success: false,
          message: 'إعدادات البريد الإلكتروني غير مكتملة'
        });
      }
      
      // Create transporter
      const transporter = nodemailer.createTransporter({
        host: settings.host,
        port: parseInt(settings.port, 10),
        secure: settings.secure === 'true',
        auth: {
          user: settings.username,
          pass: settings.password
        }
      });
      
      // Send test email
      const info = await transporter.sendMail({
        from: `"${settings.from_name || 'نيوز مركبة'}" <${settings.from_email || settings.username}>`,
        to: to,
        subject: subject,
        text: message,
        html: `<p>${message}</p>`
      });
      
      res.json({
        success: true,
        message: 'تم إرسال البريد الإلكتروني بنجاح',
        data: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected
        }
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({
        success: false,
        message: `فشل في إرسال البريد الإلكتروني: ${error.message}`
      });
    }
  }
);

// Get system info
router.get('/system/info', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get database info
    const [dbInfo] = await db.execute('SELECT VERSION() as version');
    
    // Get table sizes
    const [tableSizes] = await db.execute(`
      SELECT 
        table_name,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY (data_length + index_length) DESC
    `);
    
    // Get record counts
    const [postCount] = await db.execute('SELECT COUNT(*) as count FROM posts');
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [categoryCount] = await db.execute('SELECT COUNT(*) as count FROM categories');
    
    res.json({
      success: true,
      data: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        database: {
          version: dbInfo[0].version,
          tables: tableSizes
        },
        records: {
          posts: postCount[0].count,
          users: userCount[0].count,
          categories: categoryCount[0].count
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي'
    });
  }
});

// Backup database
router.post('/system/backup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // This is a simplified backup - in production, you'd want to use mysqldump
    const tables = ['users', 'categories', 'posts', 'settings'];
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };
    
    const tablePromises = tables.map(async (table) => {
      const [rows] = await db.execute(`SELECT * FROM ${table}`);
      return { table, rows };
    });
    
    const tableResults = await Promise.all(tablePromises);
    tableResults.forEach(({ table, rows }) => {
      backup.data[table] = rows;
    });
    
    res.json({
      success: true,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
      data: backup
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء النسخة الاحتياطية'
    });
  }
});

// Clear cache (placeholder)
router.post('/system/clear-cache', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // In a real application, you would clear Redis cache, file cache, etc.
    // For now, this is just a placeholder
    
    res.json({
      success: true,
      message: 'تم مسح الذاكرة المؤقتة بنجاح'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في مسح الذاكرة المؤقتة'
    });
  }
});

// Initialize default settings
router.post('/initialize', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const defaultSettings = [
      // General settings
      { key: 'general_site_name', value: 'نيوز مركبة', type: 'string' },
      { key: 'general_site_description', value: 'موقع إخباري شامل', type: 'string' },
      { key: 'general_site_url', value: 'https://newsmarkaba.com', type: 'string' },
      { key: 'general_admin_email', value: 'admin@newsmarkaba.com', type: 'string' },
      { key: 'general_timezone', value: 'Asia/Riyadh', type: 'string' },
      { key: 'general_language', value: 'ar', type: 'string' },
      { key: 'general_posts_per_page', value: '10', type: 'number' },
      { key: 'general_maintenance_mode', value: 'false', type: 'boolean' },
      
      // SEO settings
      { key: 'seo_meta_title', value: 'نيوز مركبة - آخر الأخبار', type: 'string' },
      { key: 'seo_meta_description', value: 'موقع نيوز مركبة للأخبار العاجلة والتقارير الشاملة', type: 'string' },
      { key: 'seo_meta_keywords', value: 'أخبار, عاجل, تقارير, نيوز مركبة', type: 'string' },
      { key: 'seo_google_analytics', value: '', type: 'string' },
      { key: 'seo_google_search_console', value: '', type: 'string' },
      
      // Social media settings
      { key: 'social_facebook', value: '', type: 'string' },
      { key: 'social_twitter', value: '', type: 'string' },
      { key: 'social_instagram', value: '', type: 'string' },
      { key: 'social_youtube', value: '', type: 'string' },
      { key: 'social_linkedin', value: '', type: 'string' },
      
      // Email settings
      { key: 'email_host', value: '', type: 'string' },
      { key: 'email_port', value: '587', type: 'number' },
      { key: 'email_secure', value: 'false', type: 'boolean' },
      { key: 'email_username', value: '', type: 'string' },
      { key: 'email_password', value: '', type: 'string' },
      { key: 'email_from_name', value: 'نيوز مركبة', type: 'string' },
      { key: 'email_from_email', value: '', type: 'string' },
      
      // Content settings
      { key: 'content_allow_comments', value: 'true', type: 'boolean' },
      { key: 'content_moderate_comments', value: 'true', type: 'boolean' },
      { key: 'content_max_upload_size', value: '5', type: 'number' },
      { key: 'content_allowed_file_types', value: 'jpg,jpeg,png,gif,webp,pdf,doc,docx', type: 'string' },
      
      // Security settings
      { key: 'security_max_login_attempts', value: '5', type: 'number' },
      { key: 'security_lockout_duration', value: '15', type: 'number' },
      { key: 'security_session_timeout', value: '1440', type: 'number' },
      { key: 'security_force_https', value: 'true', type: 'boolean' },
      
      // Advanced settings
      { key: 'advanced_debug_mode', value: 'false', type: 'boolean' },
      { key: 'advanced_cache_enabled', value: 'true', type: 'boolean' },
      { key: 'advanced_cache_duration', value: '3600', type: 'number' },
      { key: 'advanced_api_rate_limit', value: '100', type: 'number' }
    ];
    
    // Start transaction
    await db.execute('START TRANSACTION');
    
    try {
      const settingPromises = defaultSettings.map(async (setting) => db.execute(
         `INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, created_at, updated_at) 
          VALUES (?, ?, ?, NOW(), NOW())`,
         [setting.key, setting.value, setting.type]
       ));
      
      await Promise.all(settingPromises);
      
      // Commit transaction
      await db.execute('COMMIT');
      
      res.json({
        success: true,
        message: 'تم تهيئة الإعدادات الافتراضية بنجاح'
      });
    } catch (error) {
      // Rollback transaction
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تهيئة الإعدادات'
    });
  }
});

module.exports = router;