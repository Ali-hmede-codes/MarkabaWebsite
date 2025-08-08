const db = require('./server/config/database');

async function addVideoLinkField() {
  try {
    console.log('Adding video_link field to posts table...');
    
    // Check if column already exists
    const [columns] = await db.execute(
      "SHOW COLUMNS FROM posts LIKE 'video_link'"
    );
    
    if (columns.length > 0) {
      console.log('video_link column already exists!');
      return;
    }
    
    // Add video_link column
    await db.execute(`
      ALTER TABLE posts 
      ADD COLUMN video_link VARCHAR(500) NULL AFTER featured_image
    `);
    
    // Add index
    await db.execute(`
      ALTER TABLE posts 
      ADD INDEX idx_video_link (video_link)
    `);
    
    // Update table comment
    await db.execute(`
      ALTER TABLE posts 
      COMMENT = 'Posts table with video link support for YouTube embeds'
    `);
    
    console.log('Video link field added to posts table successfully!');
    
  } catch (error) {
    console.error('Error adding video_link field:', error.message);
  } finally {
    process.exit(0);
  }
}

addVideoLinkField();