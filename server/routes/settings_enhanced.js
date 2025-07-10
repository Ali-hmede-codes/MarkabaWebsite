const express = require('express');
const { query, queryOne } = require('../db');
const { auth, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Get all site settings - Public endpoint (only public settings)
router.get('/public', async (req, res) => {
  try {
    const settings = await query(
      `SELECT setting_key, setting_value, data_type
       FROM site_settings 
       WHERE is_public = 1
       ORDER BY setting_key`
    );
    
    // Process settings into a more usable format
    const processedSettings = {};
    settings.forEach(setting => {
      let value = setting.setting_value;
      
      // Convert based on data type
    switch (setting.data_type) {
      case 'boolean':
        value = value === '1' || value === 'true';
        break;
      case 'number':
        value = parseFloat(value);
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.warn(`Invalid JSON for setting ${setting.setting_key}:`, value);
        }
        break;
      default:
        // 'string' and others remain as string
        break;
    }
      
      processedSettings[setting.setting_key] = value;
    });
    
    res.json({
      success: true,
      data: processedSettings
    });
    
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: error.message
    });
  }
});

// Get all site settings (Admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let queryStr = `
      SELECT setting_key, setting_value, data_type, category, description, 
             description_ar, is_public, created_at, updated_at
      FROM site_settings
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (category) {
      queryStr += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      queryStr += ' AND (setting_key LIKE ? OR description LIKE ? OR description_ar LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    queryStr += ' ORDER BY category, setting_key';
    
    const settings = await query(queryStr, params);
    
    // Group settings by category
    const groupedSettings = {};
    settings.forEach(setting => {
      const cat = setting.category || 'general';
      if (!groupedSettings[cat]) {
        groupedSettings[cat] = [];
      }
      
      let value = setting.setting_value;
      
      // Convert based on data type
      switch (setting.data_type) {
        case 'boolean':
          value = value === '1' || value === 'true';
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn(`Invalid JSON for setting ${setting.setting_key}:`, value);
          }
          break;
        default:
          break;
      }
      
      groupedSettings[cat].push({
        ...setting,
        setting_value: value,
        is_public: Boolean(setting.is_public)
      });
    });
    
    res.json({
      success: true,
      data: {
        settings: groupedSettings,
        categories: Object.keys(groupedSettings)
      }
    });
    
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: error.message
    });
  }
});

// Get single setting by key (Admin only)
router.get('/:key', auth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await queryOne(
      `SELECT setting_key, setting_value, data_type, category, description, 
              description_ar, is_public, created_at, updated_at
       FROM site_settings
       WHERE setting_key = ?`,
      [key]
    );
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
        message: 'The requested setting does not exist'
      });
    }
    
    let value = setting.setting_value;
    
    // Convert based on data type
    switch (setting.data_type) {
      case 'boolean':
        value = value === '1' || value === 'true';
        break;
      case 'number':
        value = parseFloat(value);
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.warn(`Invalid JSON for setting ${setting.setting_key}:`, value);
        }
        break;
      default:
        break;
    }
    
    res.json({
      success: true,
      data: {
        ...setting,
        setting_value: value,
        is_public: Boolean(setting.is_public)
      }
    });
    
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch setting',
      message: error.message
    });
  }
});

// Create or update setting (Admin only)
router.put('/:key', auth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const {
      setting_value_ar,
      data_type = 'string',
      category = 'general',
      description = '',
      description_ar = '',
      is_public = false
    } = req.body;
    
    // Validate required fields
    if (setting_value_ar === undefined || setting_value_ar === null) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'setting_value_ar is required'
      });
    }
    
    // Validate data type
    const validDataTypes = ['string', 'number', 'boolean', 'json'];
    if (!validDataTypes.includes(data_type)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: `data_type must be one of: ${validDataTypes.join(', ')}`
      });
    }
    
    // Convert and validate value based on data type
    let processedValue = setting_value_ar;
    
    switch (data_type) {
      case 'boolean': {
        processedValue = setting_value_ar ? '1' : '0';
        break;
      }
      case 'number': {
        const numValue = parseFloat(setting_value_ar);
        if (Number.isNaN(numValue)) {
          return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'setting_value_ar must be a valid number for number data type'
          });
        }
        processedValue = numValue.toString();
        break;
      }
      case 'json': {
        try {
          if (typeof setting_value_ar === 'object') {
            processedValue = JSON.stringify(setting_value_ar);
          } else {
            // Validate that it's valid JSON
            JSON.parse(setting_value_ar);
            processedValue = setting_value_ar;
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'setting_value_ar must be valid JSON for json data type'
          });
        }
        break;
      }
      default:
        processedValue = setting_value_ar.toString();
        break;
    }
    
    // Check if setting exists
    const existingSetting = await queryOne(
      'SELECT setting_key FROM site_settings WHERE setting_key = ?',
      [key]
    );
    
    if (existingSetting) {
      // Update existing setting
      await query(
        `UPDATE site_settings 
         SET setting_value_ar = ?, data_type = ?, category = ?, description = ?, 
             description_ar = ?, is_public = ?, updated_at = NOW()
         WHERE setting_key = ?`,
        [processedValue, data_type, category, description, description_ar, is_public ? 1 : 0, key]
      );
    } else {
      // Create new setting
      await query(
        `INSERT INTO site_settings 
         (setting_key, setting_value_ar, data_type, category, description, description_ar, is_public, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [key, processedValue, data_type, category, description, description_ar, is_public ? 1 : 0]
      );
    }
    
    // Fetch the updated/created setting
    const updatedSetting = await queryOne(
      `SELECT setting_key, setting_value_ar, data_type, category, description, 
              description_ar, is_public, created_at, updated_at
       FROM site_settings
       WHERE setting_key = ?`,
      [key]
    );
    
    // Convert value for response
    let responseValue = updatedSetting.setting_value_ar;
    switch (updatedSetting.data_type) {
      case 'boolean':
        responseValue = responseValue === '1' || responseValue === 'true';
        break;
      case 'number':
        responseValue = parseFloat(responseValue);
        break;
      case 'json':
        try {
          responseValue = JSON.parse(responseValue);
        } catch (e) {
          // Keep as string if parsing fails
        }
        break;
      default:
        break;
    }
    
    res.json({
      success: true,
      message: existingSetting ? 'Setting updated successfully' : 'Setting created successfully',
      data: {
        ...updatedSetting,
        setting_value_ar: responseValue,
        is_public: Boolean(updatedSetting.is_public)
      }
    });
    
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update setting',
      message: error.message
    });
  }
});

// Bulk update settings (Admin only)
router.patch('/bulk', auth, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'settings must be a non-empty array'
      });
    }
    
    const results = [];
    const errors = [];
    
    const processSettings = async () => Promise.all(settings.map(async (setting) => {
        try {
          const {
            setting_key,
            setting_value_ar,
            data_type = 'string',
            category = 'general',
            description = '',
            description_ar = '',
            is_public = false
          } = setting;
          
          if (!setting_key || setting_value_ar === undefined) {
            errors.push({
              setting_key: setting_key || 'unknown',
              error: 'setting_key and setting_value_ar are required'
            });
            return null;
          }
          
          // Process value based on data type
          let processedValue = setting_value_ar;
          
          switch (data_type) {
            case 'boolean': {
              processedValue = setting_value_ar ? '1' : '0';
              break;
            }
            case 'number': {
              const numValue = parseFloat(setting_value_ar);
              if (Number.isNaN(numValue)) {
                errors.push({
                  setting_key,
                  error: 'Invalid number value'
                });
                return null;
              }
              processedValue = numValue.toString();
              break;
            }
            case 'json': {
              try {
                if (typeof setting_value_ar === 'object') {
                  processedValue = JSON.stringify(setting_value_ar);
                } else {
                  JSON.parse(setting_value_ar);
                  processedValue = setting_value_ar;
                }
              } catch (e) {
                errors.push({
                  setting_key,
                  error: 'Invalid JSON value'
                });
                return null;
              }
              break;
            }
            default:
              processedValue = setting_value_ar.toString();
              break;
          }
          
          // Check if setting exists
          const existingSetting = await queryOne(
            'SELECT setting_key FROM site_settings WHERE setting_key = ?',
            [setting_key]
          );
          
          if (existingSetting) {
            // Update existing setting
            await query(
              `UPDATE site_settings 
               SET setting_value_ar = ?, data_type = ?, category = ?, description = ?, 
                   description_ar = ?, is_public = ?, updated_at = NOW()
               WHERE setting_key = ?`,
              [processedValue, data_type, category, description, description_ar, is_public ? 1 : 0, setting_key]
            );
          } else {
            // Create new setting
            await query(
              `INSERT INTO site_settings 
               (setting_key, setting_value_ar, data_type, category, description, description_ar, is_public, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [setting_key, processedValue, data_type, category, description, description_ar, is_public ? 1 : 0]
            );
          }
          
          return {
            setting_key,
            action: existingSetting ? 'updated' : 'created'
          };
          
        } catch (error) {
          console.error(`Error processing setting ${setting.setting_key}:`, error);
          errors.push({
            setting_key: setting.setting_key || 'unknown',
            error: error.message
          });
          return null;
        }
      }));
    
    const processedResults = await processSettings();
    results.push(...processedResults.filter(result => result !== null));
    
    res.json({
      success: results.length > 0,
      message: `${results.length} settings processed successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        processed: results,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: error.message
    });
  }
});

// Delete setting (Admin only)
router.delete('/:key', auth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    
    // Check if setting exists
    const setting = await queryOne(
      'SELECT setting_key FROM site_settings WHERE setting_key = ?',
      [key]
    );
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
        message: 'The requested setting does not exist'
      });
    }
    
    // Delete setting
    await query('DELETE FROM site_settings WHERE setting_key = ?', [key]);
    
    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete setting',
      message: error.message
    });
  }
});

// Get settings categories (Admin only)
router.get('/categories/list', auth, requireAdmin, async (req, res) => {
  try {
    const categories = await query(
      `SELECT DISTINCT category, COUNT(*) as setting_count
       FROM site_settings
       WHERE category IS NOT NULL AND category != ''
       GROUP BY category
       ORDER BY category`
    );
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// Reset settings to default (Admin only)
router.post('/reset', auth, requireAdmin, async (req, res) => {
  try {
    const { category, confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required',
        message: 'Please set confirm to true to proceed with reset'
      });
    }
    
    let queryStr = 'DELETE FROM site_settings';
    const params = [];
    
    if (category) {
      queryStr += ' WHERE category = ?';
      params.push(category);
    }
    
    const result = await query(queryStr, params);
    
    // Insert default settings
    const defaultSettings = [
      {
        key: 'site_name',
        value: 'News Markaba',
        type: 'string',
        category: 'general',
        description: 'Website name',
        description_ar: 'اسم الموقع',
        is_public: true
      },
      {
        key: 'site_name_ar',
        value: 'أخبار مركبا',
        type: 'string',
        category: 'general',
        description: 'Website name in Arabic',
        description_ar: 'اسم الموقع بالعربية',
        is_public: true
      },
      {
        key: 'site_description',
        value: 'Latest news and updates',
        type: 'string',
        category: 'general',
        description: 'Website description',
        description_ar: 'وصف الموقع',
        is_public: true
      },
      {
        key: 'site_description_ar',
        value: 'آخر الأخبار والتحديثات',
        type: 'string',
        category: 'general',
        description: 'Website description in Arabic',
        description_ar: 'وصف الموقع بالعربية',
        is_public: true
      },
      {
        key: 'posts_per_page',
        value: '10',
        type: 'number',
        category: 'content',
        description: 'Number of posts per page',
        description_ar: 'عدد المقالات في الصفحة',
        is_public: true
      },
      {
        key: 'breaking_news_count',
        value: '5',
        type: 'number',
        category: 'content',
        description: 'Number of breaking news to show',
        description_ar: 'عدد الأخبار العاجلة المعروضة',
        is_public: true
      },
      {
        key: 'enable_comments',
        value: '1',
        type: 'boolean',
        category: 'features',
        description: 'Enable comments on posts',
        description_ar: 'تفعيل التعليقات على المقالات',
        is_public: true
      },
      {
        key: 'maintenance_mode',
        value: '0',
        type: 'boolean',
        category: 'system',
        description: 'Enable maintenance mode',
        description_ar: 'تفعيل وضع الصيانة',
        is_public: false
      },
      {
        key: 'default_language',
        value: 'ar',
        type: 'string',
        category: 'localization',
        description: 'Default website language',
        description_ar: 'اللغة الافتراضية للموقع',
        is_public: true
      },
      {
        key: 'contact_email',
        value: 'contact@newsmarkaba.com',
        type: 'string',
        category: 'contact',
        description: 'Contact email address',
        description_ar: 'البريد الإلكتروني للتواصل',
        is_public: true
      }
    ];
    
    // Filter by category if specified
    const settingsToInsert = category 
      ? defaultSettings.filter(s => s.category === category)
      : defaultSettings;
    
    await Promise.all(settingsToInsert.map(setting => 
      query(
        `INSERT INTO site_settings 
         (setting_key, setting_value, data_type, category, description, description_ar, is_public, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          setting.key,
          setting.value,
          setting.type,
          setting.category,
          setting.description,
          setting.description_ar,
          setting.is_public ? 1 : 0
        ]
      )
    ));
    
    res.json({
      success: true,
      message: category 
        ? `Settings for category '${category}' reset to default`
        : 'All settings reset to default',
      data: {
        deleted_count: result.affectedRows,
        created_count: settingsToInsert.length
      }
    });
    
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings',
      message: error.message
    });
  }
});

module.exports = router;