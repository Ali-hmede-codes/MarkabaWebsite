import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.markaba.news/api/v2';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { q, type = 'posts', page = '1', limit = '10', sort = 'relevance' } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  try {
    const searchQuery = q.trim();
    const results = {
      posts: [],
      lastNews: [],
      total: 0,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      query: searchQuery
    };

    // Search in posts if type is 'all' or 'posts'
    if (type === 'all' || type === 'posts') {
      try {
        const postsUrl = `${API_BASE_URL}/posts?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}&sort=${sort}`;
        const postsResponse = await fetch(postsUrl, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NewsMarkaba-Search/1.0'
          }
        });

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          if (postsData.success && postsData.data?.posts) {
            results.posts = postsData.data.posts;
            results.total += postsData.data.total || postsData.data.posts.length;
          }
        }
      } catch (error) {
        console.error('Error searching posts:', error);
      }
    }

    // Search in last-news if type is 'all' or 'last-news'
    if (type === 'all' || type === 'last-news') {
      try {
        const lastNewsUrl = `${API_BASE_URL}/last-news?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}&sort=${sort}`;
        const lastNewsResponse = await fetch(lastNewsUrl, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NewsMarkaba-Search/1.0'
          }
        });

        if (lastNewsResponse.ok) {
          const lastNewsData = await lastNewsResponse.json();
          if (lastNewsData.success && lastNewsData.data) {
            results.lastNews = Array.isArray(lastNewsData.data) ? lastNewsData.data : [];
            results.total += results.lastNews.length;
          }
        }
      } catch (error) {
        console.error('Error searching last news:', error);
      }
    }

    // If backend doesn't support search, do client-side filtering
    if (results.posts.length === 0 && results.lastNews.length === 0) {
      // Fallback: fetch all posts and filter client-side
      try {
        const allPostsUrl = `${API_BASE_URL}/posts?limit=100&sort=latest`;
        const allPostsResponse = await fetch(allPostsUrl, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NewsMarkaba-Search/1.0'
          }
        });

        if (allPostsResponse.ok) {
          const allPostsData = await allPostsResponse.json();
          if (allPostsData.success && allPostsData.data?.posts) {
            const filteredPosts = allPostsData.data.posts.filter((post: any) => {
              const title = (post.title_ar || post.title || '').toLowerCase();
              const content = (post.content_ar || post.content || '').toLowerCase();
              const excerpt = (post.excerpt_ar || post.excerpt || '').toLowerCase();
              const searchLower = searchQuery.toLowerCase();
              
              return title.includes(searchLower) || 
                     content.includes(searchLower) || 
                     excerpt.includes(searchLower);
            });

            // Apply pagination
            const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
            const endIndex = startIndex + parseInt(limit as string);
            results.posts = filteredPosts.slice(startIndex, endIndex);
            results.total = filteredPosts.length;
          }
        }
      } catch (error) {
        console.error('Error in fallback search:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}