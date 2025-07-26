import { NextApiRequest, NextApiResponse } from 'next';
import { API_BASE_URL, createTimeoutController, API_HEADERS } from '../../lib/api/config';

interface Category {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  updated_at: string;
  created_at: string;
  posts_count?: number;
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
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache for 1 hour

    // Fetch categories
    const { controller, timeoutId, cleanup } = createTimeoutController();
    
    const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, {
      headers: API_HEADERS,
      signal: controller.signal,
    });

    cleanup();

    const categoriesData = await categoriesResponse.json();
    const categories: Category[] = categoriesData.categories || [];

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news';
    const currentDate = new Date().toISOString();

    // Generate categories sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- Categories -->
${categories.map(category => {
  const lastmod = category.updated_at || category.created_at || currentDate;
  const hasRecentActivity = category.posts_count && category.posts_count > 0;
  
  return `  <url>
    <loc>${baseUrl}/categories/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${hasRecentActivity ? 'daily' : 'weekly'}</changefreq>
    <priority>${hasRecentActivity ? '0.9' : '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/categories/${category.slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/categories/${category.slug}" />
  </url>`;
}).join('\n')}

  <!-- Category Archive Pages -->
${categories.map(category => {
  const lastmod = category.updated_at || category.created_at || currentDate;
  
  return `  <url>
    <loc>${baseUrl}/categories/${category.slug}/archive</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/categories/${category.slug}/archive" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/categories/${category.slug}/archive" />
  </url>`;
}).join('\n')}

</urlset>`;

    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate categories sitemap',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}