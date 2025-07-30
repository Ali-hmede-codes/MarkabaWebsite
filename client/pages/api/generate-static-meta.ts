import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// This API endpoint helps generate static meta tags for better SEO
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    let metaTags = '';

    switch (type) {
      case 'post':
        metaTags = generatePostMeta(data);
        break;
      case 'category':
        metaTags = generateCategoryMeta(data);
        break;
      case 'home':
        metaTags = generateHomeMeta();
        break;
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    res.status(200).json({ metaTags });
  } catch (error) {
    console.error('Error generating meta tags:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function generatePostMeta(post: any): string {
  const title = post.title || 'مقال جديد';
  const description = post.excerpt || post.content?.substring(0, 160) || 'اقرأ المزيد على مـركـبـا - الـمـنـصـة الاخـبـاريـة';
  const image = post.image ? `https://markaba.news${post.image}` : 'https://markaba.news/images/og-default.svg';
  const url = `https://markaba.news/post/${post.slug}`;
  const publishedTime = post.created_at;
  const modifiedTime = post.updated_at;

  return `
    <title>${title} - مـركـبـا - الـمـنـصـة الاخـبـاريـة </title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
    <meta property="article:published_time" content="${publishedTime}" />
    <meta property="article:modified_time" content="${modifiedTime}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${url}" />
  `;
}

function generateCategoryMeta(category: any): string {
  const title = category.name_ar || 'قسم جديد';
  const description = `تصفح آخر الأخبار في قسم ${title} على   مـركـبـا - الـمـنـصـة الاخـبـاريـة`;
  const url = `https://markaba.news/category/${category.slug}`;
  const image = 'https://markaba.news/images/og-default.svg';

  return `
    <title>${title} - مـركـبـا - الـمـنـصـة الاخـبـاريـة</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${url}" />
  `;
}

function generateHomeMeta(): string {
  const title = 'مـركـبـا - الـمـنـصـة الاخـبـاريـة - آخر الأخبار والتطورات';
  const description = 'مـركـبـا - الـمـنـصـة الاخـبـاريـة - آخر الأخبار والتطورات من فلسطين والعالم العربي. تابع الأخبار العاجلة والتقارير الحصرية';
  const url = 'https://markaba.news';
  const image = 'https://markaba.news/images/og-default.svg';

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${url}" />
  `;
}