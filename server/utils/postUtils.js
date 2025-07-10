const fs = require('fs').promises;
const path = require('path');
const slugify = require('slugify');

// Generate Arabic-friendly slug
function generateArabicSlug(title_ar) {
  if (!title_ar) {
    return `untitled-${  Date.now()}`;
  }
  
  // Simple Arabic to Latin transliteration for common letters
  const arabicToLatin = {
    'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
    'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's',
    'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h'
  };
  
  const transliterated = title_ar.split('').map(char => arabicToLatin[char] || char).join('');
  return slugify(transliterated, { lower: true, strict: true });
}

// Calculate reading time based on Arabic content
function calculateReadingTime(content_ar) {
  if (!content_ar) {
    return 1; // Default to 1 minute
  }
  
  const wordsPerMinute = 200; // Average reading speed for Arabic
  
  // Remove HTML tags and count words
  const cleanContent = content_ar.replace(/<[^>]*>/g, ' ');
  const totalWords = cleanContent.split(/\s+/).filter(word => word.length > 0).length;
  
  const readingTime = Math.ceil(totalWords / wordsPerMinute);
  return Math.max(1, readingTime); // Minimum 1 minute
}

// Create post files in the file system
async function createPostFiles(postId, postData) {
  try {
    const postsDir = path.join(__dirname, '../../uploads/posts');
    const postDir = path.join(postsDir, postId.toString());
    
    // Ensure directory exists
    await fs.mkdir(postDir, { recursive: true });
    
    // Create JSON file with Arabic post data
    const arabicPostData = {
      id: postId,
      title_ar: postData.title_ar,
      content_ar: postData.content_ar,
      excerpt_ar: postData.excerpt_ar,
      slug: postData.slug,
      category_id: postData.category_id,
      author_id: postData.author_id,
      featured_image: postData.featured_image,
      tags: typeof postData.tags === 'string' ? JSON.parse(postData.tags) : postData.tags,
      meta_description_ar: postData.meta_description_ar,
      meta_keywords_ar: postData.meta_keywords_ar,
      reading_time: postData.reading_time,
      is_featured: postData.is_featured,
      is_published: postData.is_published,
      created_at: new Date().toISOString()
    };
    
    const postFile = path.join(postDir, 'post.json');
    await fs.writeFile(postFile, JSON.stringify(arabicPostData, null, 2));
    
    // Create HTML file for Arabic content
    if (postData.content_ar) {
      const htmlFileAr = path.join(postDir, 'content_ar.html');
      await fs.writeFile(htmlFileAr, postData.content_ar);
    }
    
    console.log(`Post files created for post ID: ${postId}`);
  } catch (error) {
    console.error(`Error creating post files for ID ${postId}:`, error);
    throw error;
  }
}

// Delete post files from the file system
async function deletePostFiles(postId) {
  try {
    const postsDir = path.join(__dirname, '../../uploads/posts');
    const postDir = path.join(postsDir, postId.toString());
    
    // Check if directory exists
    try {
      await fs.access(postDir);
      // Remove directory and all its contents
      await fs.rmdir(postDir, { recursive: true });
      console.log(`Post files deleted for post ID: ${postId}`);
    } catch (accessError) {
      // Directory doesn't exist, which is fine
      console.log(`No files to delete for post ID: ${postId}`);
    }
  } catch (error) {
    console.error(`Error deleting post files for ID ${postId}:`, error);
    throw error;
  }
}

module.exports = {
  generateArabicSlug,
  calculateReadingTime,
  createPostFiles,
  deletePostFiles
};