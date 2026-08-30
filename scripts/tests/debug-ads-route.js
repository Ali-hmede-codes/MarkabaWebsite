const express = require('express');
const db = require('../../server/config/database');
const { auth: authenticateToken, requireRole } = require('../../server/middlewares/auth');

const app = express();
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Test route that mimics the ads route
app.get('/test-ads', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  console.log('🔍 Starting ads route handler...');
  console.log('User:', req.user);
  
  try {
    console.log('📊 Parsing query parameters...');
    const {
      page = 1,
      limit = 10,
      search = '',
      position = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    console.log('Query params:', { page, limit, search, position, status, sortBy, sortOrder });
    
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    console.log('Calculated offset:', offset);
    
    // Build WHERE clause
    console.log('📊 Building WHERE clause...');
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      whereConditions.push('(a.title LIKE ? OR a.link_url LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (position) {
      whereConditions.push('ap.name = ?');
      queryParams.push(position);
    }
    
    if (status === 'active') {
      whereConditions.push('a.is_active = 1 AND a.expire_date > NOW()');
    } else if (status === 'expired') {
      whereConditions.push('a.expire_date <= NOW()');
    } else if (status === 'inactive') {
      whereConditions.push('a.is_active = 0');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    console.log('WHERE clause:', whereClause);
    console.log('Query params:', queryParams);
    
    // Validate sort parameters
    console.log('📊 Validating sort parameters...');
    const validSortFields = ['created_at', 'title', 'expire_date', 'clicks', 'start_date'];
    const validSortOrders = ['ASC', 'DESC'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    console.log('Final sort:', { finalSortBy, finalSortOrder });
    
    // Get total count
    console.log('📊 Executing count query...');
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
      ${whereClause}
    `;
    
    console.log('Count query:', countQuery);
    console.log('Count params:', queryParams);
    
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;
    console.log('Total count:', total);
    
    // Get ads data
    console.log('📊 Executing data query...');
    const dataQuery = `
      SELECT 
        a.id, a.title, a.image_path, a.link_url, a.start_date, a.expire_date,
        a.is_active, a.clicks, a.created_at, a.updated_at,
        ap.name as position_name, ap.name_ar as position_name_ar,
        ap.width, ap.height,
        u.username as created_by_username, u.display_name as created_by_name,
        CASE 
          WHEN a.expire_date <= NOW() THEN 'expired'
          WHEN a.is_active = 1 THEN 'active'
          ELSE 'inactive'
        END as status
      FROM ads a
      LEFT JOIN ad_positions ap ON a.position_id = ap.id
      LEFT JOIN users u ON a.created_by = u.id
      ${whereClause}
      ORDER BY a.${finalSortBy} ${finalSortOrder}
      LIMIT ${parseInt(limit, 10)} OFFSET ${offset}
    `;
    
    console.log('Data query:', dataQuery);
    const finalParams = [...queryParams];
    console.log('Final params:', finalParams);
    
    const [ads] = await db.execute(dataQuery, finalParams);
    console.log('Query executed successfully, ads count:', ads.length);
    
    const result = {
      success: true,
      data: {
        ads,
        pagination: {
          current_page: parseInt(page, 10),
          per_page: parseInt(limit, 10),
          total,
          total_pages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    };
    
    console.log('✅ Sending successful response');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error in ads route:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('Error sqlState:', error.sqlState);
    console.error('Error sqlMessage:', error.sqlMessage);
    
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
      debug: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// Test login route
app.post('/test-login', async (req, res) => {
  try {
    console.log('🔐 Test login request:', req.body);
    
    // Simple response with a test token
    res.json({
      success: true,
      data: {
        token: 'test-token-12345',
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`📋 Test endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/test-login`);
  console.log(`   - GET http://localhost:${PORT}/test-ads`);
});