import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, createTimeoutController, API_HEADERS } from '../../lib/api/config';

interface Post {
  id: number;
  slug: string;
  title_ar: string;
  title_en: string;
  meta_description_ar?: string;
  meta_description_en?: string;
  updated_at: string;
  created_at: string;
  category_id: number;
  author_name?: string;
  is_breaking?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Set content type for XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800'); // Cache for 30 minutes

    // Fetch posts
    const { controller, timeoutId, cleanup } = createTimeoutController();
    
    const postsResponse = await fetch(`${API_BASE_URL}/posts?limit=2000&sort=latest`, {
      headers: API_HEADERS,
      signal: controller.signal,
    });

    cleanup();

    const postsData = await postsResponse.json();
    const posts: Post[] = postsData.posts || [];

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsmarkaba.com';
    const currentDate = new Date().toISOString();

    // Generate posts sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Posts -->
${posts.map(post => {
  const lastmod = post.updated_at || post.created_at || currentDate;
  const isRecent = new Date(lastmod) > new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours
  const isBreaking = post.is_breaking;
  
  return `  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${isRecent ? 'hourly' : isBreaking ? 'daily' : 'weekly'}</changefreq>
    <priority>${isBreaking ? '1.0' : isRecent ? '0.9' : '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/posts/${post.slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/posts/${post.slug}" />
    ${isRecent ? `<news:news>
      <news:publication>
        <news:name>NewsMarkaba</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${lastmod}</news:publication_date>
      <news:title><![CDATA[${(post.title_ar || post.title_en || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}]]></news:title>
      ${post.meta_description_ar ? `<news:keywords><![CDATA[${post.meta_description_ar.substring(0, 100)}]]></news:keywords>` : ''}
    </news:news>` : ''}
  </url>`;
}).join('\n')}

</urlset>`;

    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating posts sitemap:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate posts sitemap',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}