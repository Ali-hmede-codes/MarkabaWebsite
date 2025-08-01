/**
 * Meta Tag Injection Utility
 * Ensures meta tags are properly injected into HTML during SSR and build time
 */

import { NextPageContext } from 'next';
import metaConfig from '../config/meta.config';

interface MetaTag {
  name?: string;
  property?: string;
  httpEquiv?: string;
  content: string;
  key?: string;
}

export interface MetaInjectionData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  locale?: string;
  siteName?: string;
  twitterCard?: string;
  twitterSite?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Generate comprehensive meta tags array for server-side injection
 */
export function generateMetaTags(data: MetaInjectionData): MetaTag[] {
  const metaTags: MetaTag[] = [];

  // Basic meta tags
  metaTags.push(
    { name: 'description', content: data.description, key: 'description' },
    { name: 'author', content: data.author || metaConfig.site.nameEn, key: 'author' },
    { name: 'robots', content: 'index, follow', key: 'robots' },
    { name: 'googlebot', content: 'index, follow', key: 'googlebot' },
    { name: 'bingbot', content: 'index, follow', key: 'bingbot' },
    { name: 'language', content: 'Arabic', key: 'language' },
    { httpEquiv: 'content-language', content: 'ar', key: 'content-language' }
  );

  // Keywords
  if (data.keywords && data.keywords.length > 0) {
    metaTags.push({
      name: 'keywords',
      content: data.keywords.join(', '),
      key: 'keywords'
    });
  }

  // Open Graph meta tags
  metaTags.push(
    { property: 'og:title', content: data.title, key: 'og:title' },
    { property: 'og:description', content: data.description, key: 'og:description' },
    { property: 'og:type', content: data.type || 'website', key: 'og:type' },
    { property: 'og:url', content: data.url || metaConfig.site.url, key: 'og:url' },
    { property: 'og:site_name', content: data.siteName || metaConfig.site.name, key: 'og:site_name' },
    { property: 'og:locale', content: data.locale || 'ar_AR', key: 'og:locale' },
    { property: 'og:locale:alternate', content: 'en_US', key: 'og:locale:alternate' }
  );

  // Open Graph image
  if (data.image) {
    metaTags.push(
      { property: 'og:image', content: data.image, key: 'og:image' },
      { property: 'og:image:width', content: '1200', key: 'og:image:width' },
      { property: 'og:image:height', content: '630', key: 'og:image:height' },
      { property: 'og:image:type', content: 'image/jpeg', key: 'og:image:type' }
    );
  }

  // Article-specific Open Graph tags
  if (data.type === 'article') {
    if (data.publishedTime) {
      metaTags.push({ property: 'article:published_time', content: data.publishedTime, key: 'article:published_time' });
    }
    if (data.modifiedTime) {
      metaTags.push({ property: 'article:modified_time', content: data.modifiedTime, key: 'article:modified_time' });
    }
    if (data.author) {
      metaTags.push({ property: 'article:author', content: data.author, key: 'article:author' });
    }
    if (data.section) {
      metaTags.push({ property: 'article:section', content: data.section, key: 'article:section' });
    }
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tag, index) => {
        metaTags.push({ property: 'article:tag', content: tag, key: `article:tag:${index}` });
      });
    }
  }

  // Twitter Card meta tags
  metaTags.push(
    { name: 'twitter:card', content: data.twitterCard || 'summary_large_image', key: 'twitter:card' },
    { name: 'twitter:title', content: data.title, key: 'twitter:title' },
    { name: 'twitter:description', content: data.description, key: 'twitter:description' },
    { name: 'twitter:site', content: data.twitterSite || '@markaba_news', key: 'twitter:site' },
    { name: 'twitter:creator', content: data.twitterSite || '@markaba_news', key: 'twitter:creator' }
  );

  // Twitter image
  if (data.image) {
    metaTags.push({ name: 'twitter:image', content: data.image, key: 'twitter:image' });
  }

  // Additional social and SEO meta tags
  metaTags.push(
    { name: 'format-detection', content: 'telephone=no', key: 'format-detection' },
    { name: 'mobile-web-app-capable', content: 'yes', key: 'mobile-web-app-capable' },
    { name: 'apple-mobile-web-app-capable', content: 'yes', key: 'apple-mobile-web-app-capable' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default', key: 'apple-mobile-web-app-status-bar-style' },
    { name: 'theme-color', content: '#3B82F6', key: 'theme-color' },
    { name: 'msapplication-TileColor', content: '#3B82F6', key: 'msapplication-TileColor' }
  );

  return metaTags;
}

/**
 * Convert meta tags array to HTML string for server-side injection
 */
export function metaTagsToHTML(metaTags: MetaTag[]): string {
  return metaTags.map(tag => {
    const attributes = [];
    
    if (tag.name) attributes.push(`name="${escapeHtml(tag.name)}"`);
    if (tag.property) attributes.push(`property="${escapeHtml(tag.property)}"`);
    if (tag.httpEquiv) attributes.push(`http-equiv="${escapeHtml(tag.httpEquiv)}"`);
    
    attributes.push(`content="${escapeHtml(tag.content)}"`);
    
    return `<meta ${attributes.join(' ')} />`;
  }).join('\n    ');
}

/**
 * Escape HTML characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate structured data JSON-LD for injection
 */
export function generateStructuredData(data: MetaInjectionData): string {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': data.type === 'article' ? 'NewsArticle' : 'WebPage',
    headline: data.title,
    description: data.description,
    url: data.url || metaConfig.site.url,
    inLanguage: 'ar',
    author: {
      '@type': 'Organization',
      name: data.author || metaConfig.site.name,
      url: metaConfig.site.url
    },
    publisher: {
      '@type': 'Organization',
      name: metaConfig.site.name,
      url: metaConfig.site.url,
      logo: {
        '@type': 'ImageObject',
        url: `${metaConfig.site.url}/images/logo.png`
      }
    }
  };

  if (data.image) {
    structuredData.image = {
      '@type': 'ImageObject',
      url: data.image,
      width: 1200,
      height: 630
    };
  }

  if (data.type === 'article') {
    if (data.publishedTime) {
      structuredData.datePublished = data.publishedTime;
    }
    if (data.modifiedTime) {
      structuredData.dateModified = data.modifiedTime;
    }
    if (data.section) {
      structuredData.articleSection = data.section;
    }
  }

  return JSON.stringify(structuredData, null, 2);
}

/**
 * Server-side meta injection for getServerSideProps or getStaticProps
 */
export function injectMetaForSSR(data: MetaInjectionData) {
  const metaTags = generateMetaTags(data);
  const structuredData = generateStructuredData(data);
  
  return {
    metaTags,
    structuredData,
    htmlMeta: metaTagsToHTML(metaTags),
    title: data.title
  };
}

export default {
  generateMetaTags,
  metaTagsToHTML,
  generateStructuredData,
  injectMetaForSSR
};