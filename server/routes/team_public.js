const express = require('express');
const { query } = require('../db');

const router = express.Router();

// Get public team members (no authentication required)
router.get('/', async (req, res) => {
  try {
    // Only get active admin users for public display
    const teamQuery = `
      SELECT 
        u.id,
        u.username,
        u.display_name,
        u.role,
        u.avatar,
        u.bio,
        u.created_at,
        COUNT(p.id) as posts_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id AND p.is_published = 1
      WHERE u.is_active = 1 
        AND u.role IN ('admin', 'editor', 'author')
        AND (u.lockout_until IS NULL OR u.lockout_until < NOW())
      GROUP BY u.id, u.username, u.display_name, u.role, u.avatar, u.bio, u.created_at
      ORDER BY 
        CASE u.role 
          WHEN 'admin' THEN 1 
          WHEN 'editor' THEN 2 
          WHEN 'author' THEN 3 
        END,
        u.created_at ASC
      LIMIT 20
    `;
    
    const teamMembers = await query(teamQuery);
    
    // Process team members for public display
    const processedMembers = teamMembers.map(member => ({
      id: member.id,
      username: member.username,
      display_name: member.display_name,
      role: member.role,
      avatar: member.avatar,
      bio: member.bio || null,
      posts_count: member.posts_count || 0,
      joined_date: member.created_at
    }));
    
    res.json({
      success: true,
      data: processedMembers,
      total: processedMembers.length
    });
    
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم الداخلي',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;