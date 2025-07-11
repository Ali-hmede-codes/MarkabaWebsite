// Test script to verify Pagination type and functionality
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

log('🔍 Testing Pagination Type and Components...', 'blue');
log('', 'reset');

// Check if types file exists and contains Pagination
const typesPath = path.join(__dirname, 'client', 'components', 'API', 'types.ts');
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  if (typesContent.includes('export interface Pagination')) {
    log('✅ Pagination interface found in types.ts', 'green');
  } else {
    log('❌ Pagination interface NOT found in types.ts', 'red');
  }
  
  // Check for proper export
  if (typesContent.includes('Pagination,')) {
    log('✅ Pagination is properly exported', 'green');
  } else {
    log('⚠️  Pagination export might be missing', 'yellow');
  }
} else {
  log('❌ types.ts file not found', 'red');
}

// Check if index file exports Pagination
const indexPath = path.join(__dirname, 'client', 'components', 'API', 'index.ts');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (indexContent.includes('Pagination')) {
    log('✅ Pagination is exported from index.ts', 'green');
  } else {
    log('❌ Pagination is NOT exported from index.ts', 'red');
  }
} else {
  log('❌ index.ts file not found', 'red');
}

// Check UsersAPI component
const usersAPIPath = path.join(__dirname, 'client', 'components', 'API', 'UsersAPI.tsx');
if (fs.existsSync(usersAPIPath)) {
  const usersAPIContent = fs.readFileSync(usersAPIPath, 'utf8');
  
  if (usersAPIContent.includes('import { User, APIComponentProps, Pagination }')) {
    log('✅ UsersAPI properly imports Pagination', 'green');
  } else {
    log('❌ UsersAPI does NOT properly import Pagination', 'red');
  }
  
  if (usersAPIContent.includes('pagination: Pagination | null')) {
    log('✅ UsersAPI uses Pagination type correctly', 'green');
  } else {
    log('❌ UsersAPI does NOT use Pagination type correctly', 'red');
  }
} else {
  log('❌ UsersAPI.tsx file not found', 'red');
}

log('', 'reset');
log('📋 Test Summary:', 'blue');
log('If all checks show ✅, then Pagination should work correctly.', 'reset');
log('If you see ❌, there might be an import/export issue.', 'reset');
log('', 'reset');
log('💡 To fix any issues:', 'yellow');
log('1. Ensure Pagination interface is defined in types.ts', 'reset');
log('2. Ensure Pagination is exported from index.ts', 'reset');
log('3. Ensure components import Pagination correctly', 'reset');
log('', 'reset');