-- Add video_link field to posts table
-- This allows posts to include YouTube video links for embedded video players

USE markabadatabase;

-- Add video_link column to posts table
ALTER TABLE posts 
ADD COLUMN video_link VARCHAR(500) NULL AFTER featured_image,
ADD INDEX idx_video_link (video_link);

-- Update comment
ALTER TABLE posts COMMENT = 'Posts table with video link support for YouTube embeds';

SELECT 'Video link field added to posts table successfully!' as message;