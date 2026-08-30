// Test if the ads route can be imported without errors
try {
  console.log('🔍 Testing ads route import...');
  
  // Test database connection first
  console.log('1️⃣ Testing database connection...');
  const db = require('../../server/config/database');
  console.log('✅ Database module imported successfully');
  
  // Test auth middleware
  console.log('2️⃣ Testing auth middleware...');
  const { auth: authenticateToken, requireRole } = require('../../server/middlewares/auth');
  console.log('✅ Auth middleware imported successfully');
  
  // Test ads route import
  console.log('3️⃣ Testing ads route import...');
  const adsRoutes = require('../../server/routes/ads_enhanced');
  console.log('✅ Ads routes imported successfully');
  console.log('Route type:', typeof adsRoutes);
  
  // Test if it's a valid Express router
  if (adsRoutes && typeof adsRoutes.stack !== 'undefined') {
    console.log('✅ Valid Express router detected');
    console.log('Number of routes:', adsRoutes.stack.length);
    
    // List all routes
    adsRoutes.stack.forEach((layer, index) => {
      const route = layer.route;
      if (route) {
        const methods = Object.keys(route.methods).join(', ').toUpperCase();
        console.log(`   Route ${index + 1}: ${methods} ${route.path}`);
      }
    });
  } else {
    console.log('❌ Not a valid Express router');
  }
  
  console.log('\n🎉 All imports successful!');
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack trace:', error.stack);
}