const express = require('express');
const db = require('../../server/config/database');
const { auth: authenticateToken, requireRole } = require('../../server/middlewares/auth');

const app = express();
app.use(express.json());

// Import the actual ads routes
const adsRoutes = require('../../server/routes/ads_enhanced');

// Use the ads routes
app.use('/test-ads', adsRoutes);

// Test endpoint to verify database connection
app.get('/test-db', async (req, res) => {
  try {
    const [result] = await db.execute('SELECT 1 as test');
    res.json({ success: true, message: 'Database connected', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint to check tables
app.get('/test-tables', async (req, res) => {
  try {
    const [ads] = await db.execute('SELECT COUNT(*) as count FROM ads');
    const [positions] = await db.execute('SELECT COUNT(*) as count FROM ad_positions');
    res.json({ 
      success: true, 
      data: { 
        ads_count: ads[0].count, 
        positions_count: positions[0].count 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Minimal test server running on port ${PORT}`);
  console.log(`📋 Test endpoints:`);
  console.log(`   - GET http://localhost:${PORT}/test-db`);
  console.log(`   - GET http://localhost:${PORT}/test-tables`);
  console.log(`   - GET http://localhost:${PORT}/test-ads (requires auth)`);
});