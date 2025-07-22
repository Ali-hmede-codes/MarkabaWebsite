const express = require('express');

const router = express.Router();

// Placeholder for breaking news routes
router.get('/', (req, res) => {
  res.json({ message: 'Breaking News Admin API' });
});

module.exports = router;