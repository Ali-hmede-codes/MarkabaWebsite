import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, createTimeoutController, API_HEADERS } from '../../lib/api/config';

interface Post {
  id: number;
  slug: string;
  title_ar: string;
  title_en: string;
  updated_at: string;
  created_at: string;
  category_id: number;
}

interface Category {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  updated_at: string;
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
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    // Fetch posts and categories
    const { controller, timeoutId, cleanup } = createTimeoutController();
    
    const [postsResponse, categoriesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/posts?limit=1000&sort=latest`, {
        headers: API_HEADERS,
        signal: controller.signal,
      }),
      fetch(`${API_BASE_URL}/categories`, {
        headers: API_HEADERS,
        signal: controller.signal,
      })
    ]);

    cleanup();

    const postsData = await postsResponse.json();
    const categoriesData = await categoriesResponse.json();

    const posts: Post[] = postsData.posts || [];
    const categories: Category[] = categoriesData.categories || [];

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news';
    const currentDate = new Date().toISOString();

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/" />
  </url>

  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/about" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/about" />
  </url>
  
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/contact" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/contact" />
  </url>
  
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/categories" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/categories" />
  </url>
  
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/search" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/search" />
  </url>
  
  <url>
    <loc>${baseUrl}/sitemap</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/sitemap" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/sitemap" />
  </url>
  
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/privacy" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/privacy" />
  </url>
  
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/terms" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/terms" />
  </url>

  <!-- Categories -->
${categories.map(category => `  <url>
    <loc>${baseUrl}/categories/${category.slug}</loc>
    <lastmod>${category.updated_at || currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/categories/${category.slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/categories/${category.slug}" />
  </url>`).join('\n')}

  <!-- Posts -->
${posts.map(post => {
  const lastmod = post.updated_at || post.created_at || currentDate;
  const isRecent = new Date(lastmod) > new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours
  
  return `  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${isRecent ? 'hourly' : 'weekly'}</changefreq>
    <priority>${isRecent ? '0.9' : '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/posts/${post.slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/posts/${post.slug}" />
    ${isRecent ? `<news:news>
      <news:publication>
        <news:name>Markaba News</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${lastmod}</news:publication_date>
      <news:title><![CDATA[${post.title_ar || post.title_en}]]></news:title>
    </news:news>` : ''}
  </url>`;
}).join('\n')}

</urlset>`;

    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate sitemap',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}