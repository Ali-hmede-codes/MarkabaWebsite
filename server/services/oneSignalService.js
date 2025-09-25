// const OneSignal = require('onesignal-node'); // Commented out as we're using direct HTTPS requests
const https = require('https');

require('dotenv').config();

// Initialize OneSignal client with updated configuration (kept for potential future use)
// const client = new OneSignal.Client({
//   userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
//   app: {
//     appAuthKey: process.env.ONESIGNAL_APP_AUTH_KEY,
//     appId: process.env.ONESIGNAL_APP_ID
//   }
// });

// Alternative initialization method for newer versions
const createNotification = async (notificationData) => {
  try {
    // Use direct HTTP request approach for better compatibility
    const postData = JSON.stringify(notificationData);
    
    const options = {
      hostname: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${process.env.ONESIGNAL_APP_AUTH_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve({ body: response, statusCode: res.statusCode });
            } else {
              reject(new Error(`OneSignal API Error: ${JSON.stringify(response)}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse OneSignal response: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('OneSignal notification error:', error);
    throw error;
  }
};

/**
 * Send notification for new post
 * @param {Object} post - The created post object
 */
const sendPostNotification = async (post) => {
  try {
    if (!post || !post.title_ar) {
      console.error('Invalid post data for notification');
      return;
    }

    const notificationData = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {
        ar: `منشور جديد: ${post.title_ar}`,
        en: `New Post: ${post.title_ar}`
      },
      headings: {
        ar: 'منشور جديد',
        en: 'New Post'
      },
      included_segments: ['All'],
      url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/posts/${post.id}/${post.slug}`,
      data: {
        type: 'post',
        postId: post.id,
        slug: post.slug
      },
      large_icon: `${process.env.CLIENT_URL || 'http://localhost:3000'}/images/logo.png`,
      big_picture: post.featured_image ? `${process.env.CLIENT_URL || 'http://localhost:3000'}${post.featured_image}` : null
    };

    const response = await createNotification(notificationData);
    console.log('Post notification sent successfully:', response.body && response.body.id ? response.body.id : response.id);
    return response;
  } catch (error) {
    console.error('Error sending post notification:', error);
    throw error;
  }
};

/**
 * Send notification for breaking news
 * @param {Object} breakingNews - The created breaking news object
 */
const sendBreakingNewsNotification = async (breakingNews) => {
  try {
    if (!breakingNews || !breakingNews.title_ar) {
      console.error('Invalid breaking news data for notification');
      return;
    }

    const notificationData = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {
        ar: `عاجل: ${breakingNews.title_ar}`,
        en: `Breaking: ${breakingNews.title_ar}`
      },
      headings: {
        ar: '🚨 خبر عاجل',
        en: '🚨 Breaking News'
      },
      included_segments: ['All'],
      url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/breaking/${breakingNews.id}/${breakingNews.slug}`,
      data: {
        type: 'breaking_news',
        newsId: breakingNews.id,
        slug: breakingNews.slug
      },
      priority: 10, // High priority for breaking news
      large_icon: `${process.env.CLIENT_URL || 'http://localhost:3000'}/images/breaking-news-icon.png`,
      android_accent_color: 'FF0000', // Red color for urgency
      ios_badgeType: 'Increase',
      ios_badgeCount: 1
    };

    const response = await createNotification(notificationData);
    console.log('Breaking news notification sent successfully:', response.body && response.body.id ? response.body.id : response.id);
    return response;
  } catch (error) {
    console.error('Error sending breaking news notification:', error);
    throw error;
  }
};

/**
 * Send notification for last news
 * @param {Object} lastNews - The created last news object
 */
const sendLastNewsNotification = async (lastNews) => {
  try {
    if (!lastNews || !lastNews.title_ar) {
      console.error('Invalid last news data for notification');
      return;
    }

    const notificationData = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {
        ar: `آخر الأخبار: ${lastNews.title_ar}`,
        en: `Latest News: ${lastNews.title_ar}`
      },
      headings: {
        ar: 'آخر الأخبار',
        en: 'Latest News'
      },
      included_segments: ['All'],
      url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/last-news/${lastNews.id}/${lastNews.slug}`,
      data: {
        type: 'last_news',
        newsId: lastNews.id,
        slug: lastNews.slug
      },
      large_icon: `${process.env.CLIENT_URL || 'http://localhost:3000'}/images/news-icon.png`,
      android_accent_color: '0066CC' // Blue color for regular news
    };

    const response = await createNotification(notificationData);
    console.log('Last news notification sent successfully:', response.body && response.body.id ? response.body.id : response.id);
    return response;
  } catch (error) {
    console.error('Error sending last news notification:', error);
    throw error;
  }
};

/**
 * Test OneSignal connection
 */
const testConnection = async () => {
  try {
    const notificationData = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {
        ar: 'اختبار الإشعارات',
        en: 'Test Notification'
      },
      headings: {
        ar: 'اختبار',
        en: 'Test'
      },
      included_segments: ['Test Users'] // Only send to test segment
    };

    const response = await createNotification(notificationData);
    console.log('Test notification sent successfully:', response.body && response.body.id ? response.body.id : response.id);
    return response;
  } catch (error) {
    console.error('Error testing OneSignal connection:', error);
    throw error;
  }
};

module.exports = {
  sendPostNotification,
  sendBreakingNewsNotification,
  sendLastNewsNotification,
  testConnection
};