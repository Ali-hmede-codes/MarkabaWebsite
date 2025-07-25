const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// eslint-disable-next-line no-console
console.log('Environment loaded:');
// eslint-disable-next-line no-console
console.log('- NODE_ENV:', process.env.NODE_ENV);
// eslint-disable-next-line no-console
console.log('- PORT:', process.env.PORT);
// eslint-disable-next-line no-console
console.log('- DB_HOST:', process.env.DB_HOST);
// eslint-disable-next-line no-console
console.log('- DB_NAME:', process.env.DB_NAME);
// eslint-disable-next-line no-console
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
// eslint-disable-next-line no-console
console.log('- BACKEND_URL:', process.env.BACKEND_URL);

// Import database connection
const { testConnection } = require('./db.cjs');

// Import enhanced routes
const authEnhancedRoutes = require('./routes/auth_enhanced.cjs');
const postsRoutes = require('./routes/posts_combined.cjs');
const categoriesEnhancedRoutes = require('./routes/categories_enhanced.cjs');
const breakingNewsEnhancedRoutes = require('./routes/breakingNews_enhanced.cjs');
const lastNewsEnhancedRoutes = require('./routes/lastNews_enhanced.cjs');
const mediaEnhancedRoutes = require('./routes/media_enhanced.cjs');
const usersEnhancedRoutes = require('./routes/users_enhanced.cjs');
const settingsEnhancedRoutes = require('./routes/settings_enhanced.cjs');
const weatherEnhancedRoutes = require('./routes/weather_enhanced.cjs');
const prayerEnhancedRoutes = require('./routes/prayer_enhanced.cjs');
const socialMediaEnhancedRoutes = require('./routes/socialMedia_enhanced.cjs');

// Import admin routes
const adminRoutes = require('./routes/admin/index.cjs');

// Import images route
const imagesRoutes = require('./routes/images.cjs');

// Import scheduler service
const Scheduler = require('./utils/scheduler.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Trust proxy for rate limiting behind reverse proxy
if (isProduction) {
  app.set('trust proxy', 1);
}

// Rate limiting removed for unlimited access

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration for API routes
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://69.62.115.12',
      'http://69.62.115.12:3000',
      'http://69.62.115.12:3001',
      'http://69.62.115.12:5000',
      'http://69.62.115.12:5000/uploads',
      'https://69.62.115.12',
      'https://69.62.115.12:3000',
      'https://69.62.115.12:3001',
      'https://69.62.115.12:5000',
      'https://69.62.115.12:5000/uploads'
    ];
    
    // Add production domains from environment
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
      allowedOrigins.push(...additionalOrigins);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || isDevelopment) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      // eslint-disable-next-line no-console
      console.log('CORS blocked origin for API:', origin);
      callback(null, true); // Allow anyway for now to fix the issue
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Accept', 'Accept-Encoding'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Apply CORS globally with preflight handling
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Accept-Encoding');
  res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Count, Content-Length, Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
if (isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON',
        message: 'Request body contains invalid JSON'
      });
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Enhanced CORS options for static files
const staticCorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (direct access, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://69.62.115.12',
      'http://69.62.115.12:3000',
      'http://69.62.115.12:3001',
      'http://69.62.115.12:5000',
      'https://69.62.115.12',
      'https://69.62.115.12:3000',
      'https://69.62.115.12:3001',
      'https://69.62.115.12:5000'
    ];
    
    // Add production domains from environment
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
      allowedOrigins.push(...additionalOrigins);
    }
    
    // Always allow in development or if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || isDevelopment) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      // eslint-disable-next-line no-console
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for now to fix the issue
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Accept', 'Accept-Encoding'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

// Static file serving for uploads with enhanced CORS and NO caching
// Serve from server/public/uploads first (for admin posts)
app.use('/uploads', cors(staticCorsOptions), express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Accept-Encoding');
    
    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set content type for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Fallback to root uploads directory (for media_enhanced)
app.use('/uploads', cors(staticCorsOptions), express.static(path.join(__dirname, '../uploads'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Accept-Encoding');
    
    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set content type for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Serve Next.js static files
const clientBuildPath = path.join(__dirname, '../client/.next');
const clientPublicPath = path.join(__dirname, '../client/public');

// Serve Next.js static assets
app.use('/_next', express.static(path.join(clientBuildPath, 'static'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Serve public assets with enhanced CORS and NO caching
const staticOptions = {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Accept-Encoding');
    
    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set content type for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
};

app.use('/images', cors(staticCorsOptions), express.static(path.join(clientPublicPath, 'images'), staticOptions));

app.use('/content', cors(staticCorsOptions), express.static(path.join(clientPublicPath, 'content'), staticOptions));

// Serve other public files with enhanced CORS and NO caching
app.use(cors(staticCorsOptions), express.static(clientPublicPath, {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Accept, Accept-Encoding');
    
    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set content type for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await testConnection();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'News Markaba API - Enhanced Version',
    version: '2.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      categories: '/api/categories',
      breaking_news: '/api/breaking-news',
      media: '/api/media',
      users: '/api/users',
      settings: '/api/settings',
      weather: '/api/weather',
      prayer: '/api/prayer',
      social_media: '/api/social-media',
      admin: '/api/admin/administratorpage'
    },
    features: [
      'Enhanced Arabic support',
      'Advanced filtering and pagination',
      'File system integration for posts',
      'Comprehensive media management',
      'Role-based access control',
      'Security middleware',
      'Bulk operations',
      'Statistics and analytics',
      'Automated weather updates for Lebanon',
      'Prayer times for Lebanon with daily updates'
    ]
  });
});

// Rate limiting removed - no restrictions applied

// Enhanced API routes (v2)
app.use('/api/v2/auth', authEnhancedRoutes);
app.use('/api/v2/posts', postsRoutes);
app.use('/api/v2/categories', categoriesEnhancedRoutes);
app.use('/api/v2/breaking-news', breakingNewsEnhancedRoutes);
app.use('/api/v2/last-news', lastNewsEnhancedRoutes);
app.use('/api/v2/media', mediaEnhancedRoutes);
app.use('/api/v2/users', usersEnhancedRoutes);
app.use('/api/v2/settings', settingsEnhancedRoutes);
app.use('/api/v2/weather', weatherEnhancedRoutes);
app.use('/api/v2/prayer', prayerEnhancedRoutes);
app.use('/api/v2/social-media', socialMediaEnhancedRoutes);
app.use('/api/v2/admin/administratorpage', adminRoutes);
app.use('/api/v2/images', imagesRoutes);

// Legacy v1 routes removed - only enhanced routes available

// Default enhanced routes (latest version)
app.use('/api/auth', authEnhancedRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesEnhancedRoutes);
app.use('/api/breaking-news', breakingNewsEnhancedRoutes);
app.use('/api/media', mediaEnhancedRoutes);
app.use('/api/users', usersEnhancedRoutes);
app.use('/api/settings', settingsEnhancedRoutes);
app.use('/api/weather', weatherEnhancedRoutes);
app.use('/api/prayer', prayerEnhancedRoutes);
app.use('/api/social-media', socialMediaEnhancedRoutes);
app.use('/api/admin/administratorpage', adminRoutes);
app.use('/api/images', imagesRoutes);

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details || null
    });
  }

  if (err.name === 'UnauthorizedError' || err.message === 'jwt malformed') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: 'File size exceeds the maximum allowed limit'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file upload',
      message: 'Unexpected file field or too many files'
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: 'Origin not allowed by CORS policy'
    });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this information already exists'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      error: 'Invalid Reference',
      message: 'Referenced record does not exist'
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = isProduction ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: 'Server Error',
    message,
    ...(isDevelopment && { stack: err.stack })
  });
  
  // Don't call next() as we're handling the error here
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    available_versions: ['v1 (legacy)', 'v2 (enhanced)', 'latest (enhanced)'],
    documentation: '/api'
  });
});

// Serve Next.js frontend for all non-API routes
app.get('*', async (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/_next/')) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'The requested resource was not found',
      api_base: '/api'
    });
  }

  try {
    // Check if Next.js build exists
    const indexPath = path.join(__dirname, '../client/.next/server/pages/index.html');
    
    // Try to serve the built Next.js page
    try {
      await fs.access(indexPath);
      res.sendFile(indexPath);
    } catch (error) {
      // Fallback to a simple HTML page that loads the Next.js app
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>News Markaba</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .links {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .link {
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            color: white;
            transition: all 0.3s ease;
        }
        .link:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .status {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📰 News Markaba</div>
        <div class="message">
            Welcome to News Markaba! Your backend server is running successfully.
        </div>
        <div class="links">
            <a href="/api" class="link">📚 API Documentation</a>
            <a href="/api/posts" class="link">📝 Posts API</a>
            <a href="/api/categories" class="link">📂 Categories API</a>
            <a href="/health" class="link">💚 Health Check</a>
        </div>
        <div class="status">
            <h3>🚀 Server Status</h3>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Port:</strong> ${PORT}</p>
            <p><strong>API Base:</strong> /api</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="margin-top: 2rem; opacity: 0.7;">
            <p>To access the full frontend, please build the Next.js client:</p>
            <code style="background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 5px;">cd client && npm run build</code>
        </div>
    </div>
</body>
</html>`;
      res.send(htmlContent);
    }
  } catch (error) {
    console.error('Error serving frontend:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Unable to serve frontend'
    });
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received. Shutting down gracefully...');
  
  // Stop scheduler
  if (global.scheduler) {
    global.scheduler.stop();
  }
  
  let serversToClose = 0;
  let serversClosed = 0;
  
  const checkAllClosed = () => {
    serversClosed += 1;
    if (serversClosed >= serversToClose) {
      // eslint-disable-next-line no-console
      console.log('All servers closed. Process terminated');
      process.exit(0);
    }
  };
  
  if (global.httpServer) {
    serversToClose += 1;
    global.httpServer.close(checkAllClosed);
  }
  
  if (global.httpsServer) {
    serversToClose += 1;
    global.httpsServer.close(checkAllClosed);
  }
  
  if (serversToClose === 0) {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received. Shutting down gracefully...');
  
  // Stop scheduler
  if (global.scheduler) {
    global.scheduler.stop();
  }
  
  let serversToClose = 0;
  let serversClosed = 0;
  
  const checkAllClosed = () => {
    serversClosed += 1;
    if (serversClosed >= serversToClose) {
      console.log('All servers closed. Process terminated');
      process.exit(0);
    }
  };
  
  if (global.httpServer) {
    serversToClose += 1;
    global.httpServer.close(checkAllClosed);
  }
  
  if (global.httpsServer) {
    serversToClose += 1;
    global.httpsServer.close(checkAllClosed);
  }
  
  if (serversToClose === 0) {
    process.exit(0);
  }
});

// Unhandled promise rejection handling
process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, just log the error
  if (!isProduction) {
    process.exit(1);
  }
});

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error);
  // Exit the process as the application is in an undefined state
  process.exit(1);
});

// Initialize server
const startServer = async () => {
  try {
    // Test database connection before starting server
    // eslint-disable-next-line no-console
    console.log('Testing database connection...');
    await testConnection();
    // eslint-disable-next-line no-console
    console.log('✅ Database connection successful');

    // Initialize scheduler service
    // eslint-disable-next-line no-console
    console.log('Initializing scheduler service...');
    const scheduler = new Scheduler();
    await scheduler.initializeWeatherData();
    await scheduler.initializePrayerData();
    scheduler.start();
    // eslint-disable-next-line no-console
    console.log('✅ Scheduler service initialized');

    // Store scheduler reference for graceful shutdown
    global.scheduler = scheduler;

    // Ensure upload directories exist
    const uploadDirs = [
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../uploads/posts'),
      path.join(__dirname, '../uploads/breaking_news'),
      path.join(__dirname, '../uploads/categories'),
      path.join(__dirname, '../uploads/avatars'),
      path.join(__dirname, '../uploads/general')
    ];

    await Promise.all(uploadDirs.map(async (dir) => {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          // eslint-disable-next-line no-console
          console.warn(`Warning: Could not create upload directory ${dir}:`, error.message);
        }
      }
    }));
    // eslint-disable-next-line no-console
    console.log('✅ Upload directories initialized');

    // Start HTTP and HTTPS servers
    let httpsServer;
    const httpServer = http.createServer(app);
    httpServer.listen(PORT, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log('🚀 News Markaba Enhanced Server Started');
      // eslint-disable-next-line no-console
      console.log(`📡 HTTP Server running on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Try to start HTTPS server
    try {
      const sslPath = path.join(__dirname, 'ssl');
      const privateKey = await fs.readFile(path.join(sslPath, 'private-key.pem'), 'utf8');
      const certificate = await fs.readFile(path.join(sslPath, 'certificate.pem'), 'utf8');
      
      const credentials = {
        key: privateKey,
        cert: certificate
      };
      
      const httpsPort = process.env.HTTPS_PORT || 3443;
      httpsServer = https.createServer(credentials, app);
      httpsServer.listen(httpsPort, '0.0.0.0', () => {
        // eslint-disable-next-line no-console
        console.log(`🔒 HTTPS Server running on port ${httpsPort}`);
        // eslint-disable-next-line no-console
        console.log(`📚 API Documentation: https://69.62.115.12:${httpsPort}/api`);
        // eslint-disable-next-line no-console
        console.log(`🔍 Health Check: https://69.62.115.12:${httpsPort}/health`);
        // eslint-disable-next-line no-console
        console.log('📋 Available API Versions:');
        // eslint-disable-next-line no-console
        console.log(`   • v1 (legacy): https://69.62.115.12:${httpsPort}/api/v1/*`);
        // eslint-disable-next-line no-console
        console.log(`   • v2 (enhanced): https://69.62.115.12:${httpsPort}/api/v2/*`);
        // eslint-disable-next-line no-console
        console.log(`   • latest: https://69.62.115.12:${httpsPort}/api/*`);
        // eslint-disable-next-line no-console
        console.log('✨ Enhanced features enabled:');
        // eslint-disable-next-line no-console
        console.log('   • Advanced Arabic support');
        // eslint-disable-next-line no-console
        console.log('   • File system integration');
        console.log('   • Comprehensive filtering');
        console.log('   • Security middleware');
        console.log('   • Bulk operations');
        console.log('   • Statistics & analytics');
        console.log('   • Automated weather updates for Lebanon');
        console.log('   • Prayer times for Lebanon with daily updates');
        console.log(`🌤️  Weather API: https://69.62.115.12:${httpsPort}/api/weather`);
        console.log(`🕌 Prayer Times API: https://69.62.115.12:${httpsPort}/api/prayer`);
        console.log('⏰ Weather updates scheduled daily at 6:00 AM (Beirut time)');
        console.log('🕐 Prayer times updates scheduled daily at 5:00 AM (Beirut time)');
      });
      
    } catch (sslError) {
      console.warn('⚠️  HTTPS server could not be started:', sslError.message);
      console.log('📡 Only HTTP server is running');
      console.log(`📚 API Documentation: http://69.62.115.12:${PORT}/api`);
      console.log(`🔍 Health Check: http://69.62.115.12:${PORT}/health`);
      console.log('📋 Available API Versions:');
      console.log(`   • v1 (legacy): http://69.62.115.12:${PORT}/api/v1/*`);
      console.log(`   • v2 (enhanced): http://69.62.115.12:${PORT}/api/v2/*`);
      console.log(`   • latest: http://69.62.115.12:${PORT}/api/*`);
      console.log('✨ Enhanced features enabled:');
      console.log('   • Advanced Arabic support');
      console.log('   • File system integration');
      console.log('   • Comprehensive filtering');
      console.log('   • Security middleware');
      console.log('   • Bulk operations');
      console.log('   • Statistics & analytics');
      console.log('   • Automated weather updates for Lebanon');
      console.log('   • Prayer times for Lebanon with daily updates');
      console.log(`🌤️  Weather API: http://69.62.115.12:${PORT}/api/weather`);
      console.log(`🕌 Prayer Times API: http://69.62.115.12:${PORT}/api/prayer`);
      console.log('⏰ Weather updates scheduled daily at 6:00 AM (Beirut time)');
      console.log('🕐 Prayer times updates scheduled daily at 5:00 AM (Beirut time)');
    }

    // Store server references for graceful shutdown
    global.httpServer = httpServer;
    global.httpsServer = httpsServer;

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;