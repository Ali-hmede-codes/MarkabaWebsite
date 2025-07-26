import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news';
  
  const robotsTxt = `# Robots.txt for Markaba News
# Generated dynamically

# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /uploads/temp/
Disallow: /auth/

# Allow specific bots with enhanced permissions
User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /uploads/temp/
Disallow: /auth/

User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /uploads/temp/
Disallow: /auth/

# Social media bots
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: TelegramBot
Allow: /

# Disallow known malicious bots
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MajesticSEO
Disallow: /

# Crawl delay for heavy crawlers
User-agent: *
Crawl-delay: 1

# Sitemap locations
Sitemap: ${baseUrl}/api/sitemap.xml
Sitemap: ${baseUrl}/sitemap-main.xml
Sitemap: ${baseUrl}/sitemap-posts.xml
Sitemap: ${baseUrl}/sitemap-categories.xml

# Host directive
Host: ${baseUrl.replace('https://', '').replace('http://', '')}
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // Cache for 24 hours
  res.status(200).send(robotsTxt);
}