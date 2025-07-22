const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Image serving endpoint with proper CORS
router.get('/*', (req, res) => {
  try {
    const imagePath = req.params[0];
    
    // Security: prevent directory traversal
    if (imagePath.includes('..') || imagePath.includes('~')) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    // Try different possible locations for the image
    const possiblePaths = [
      path.join(__dirname, '../public/uploads', imagePath),
      path.join(__dirname, '../../uploads', imagePath),
      path.join(__dirname, '../uploads', imagePath)
    ];

    let foundPath = null;
    let i = 0;
    while (i < possiblePaths.length && !foundPath) {
      if (fs.existsSync(possiblePaths[i])) {
        foundPath = possiblePaths[i];
      }
      i += 1;
    }

    if (!foundPath) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set proper CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Set content type based on file extension
    const ext = path.extname(foundPath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = contentTypes[ext] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('ETag', `"${fs.statSync(foundPath).mtime.getTime()}"`);
    
    // Send the file
    res.sendFile(foundPath);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle OPTIONS requests for CORS preflight
router.options('/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.status(200).end();
});

module.exports = router;