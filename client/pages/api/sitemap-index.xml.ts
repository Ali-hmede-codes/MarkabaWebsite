import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newsmarkaba.com';
  const currentDate = new Date().toISOString();

  // Generate sitemap index XML
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Main sitemap with static pages -->
  <sitemap>
    <loc>${baseUrl}/api/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

  <!-- Posts sitemap -->
  <sitemap>
    <loc>${baseUrl}/api/sitemap-posts.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

  <!-- Categories sitemap -->
  <sitemap>
    <loc>${baseUrl}/api/sitemap-categories.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

  <!-- Static sitemap files -->
  <sitemap>
    <loc>${baseUrl}/sitemap-main.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

</sitemapindex>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache for 1 hour
  res.status(200).send(sitemapIndex);
}