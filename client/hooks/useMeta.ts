import { useMemo } from 'react';
import metaConfig, { getPageMeta } from '../config/meta.config';

interface MetaData {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  locale?: string;
}

interface UseMetaOptions {
  pageType?: 'home' | 'category' | 'post' | 'search' | 'about' | 'contact' | 'custom';
  data?: Record<string, any>;
  customMeta?: MetaData;
  language?: 'ar' | 'en';
}

export const useMeta = (options: UseMetaOptions = {}) => {
  const {
    pageType = 'custom',
    data = {},
    customMeta = {},
    language = 'ar'
  } = options;

  const meta = useMemo(() => {
    // Get base meta from templates or defaults
    let baseMeta;
    if (pageType === 'custom') {
      baseMeta = metaConfig.defaults;
    } else {
      const pageMeta = getPageMeta(pageType, data);
      baseMeta = {
        title: language === 'ar' ? pageMeta.title : pageMeta.titleEn,
        description: language === 'ar' ? pageMeta.description : pageMeta.descriptionEn,
        keywords: language === 'ar' ? metaConfig.defaults.keywords : metaConfig.defaults.keywordsEn,
        image: metaConfig.defaults.image,
        type: metaConfig.defaults.type,
        locale: language === 'ar' ? metaConfig.defaults.locale : metaConfig.defaults.localeEn
      };
    }

    // Merge with custom meta
    const finalMeta = {
      ...baseMeta,
      ...customMeta,
      url: customMeta.url || (typeof window !== 'undefined' ? window.location.href : metaConfig.site.url)
    };

    return finalMeta;
  }, [pageType, data, customMeta, language]);

  // Generate structured data
  const structuredData = useMemo(() => {
    const baseSchema = {
      '@context': 'https://schema.org',
      ...metaConfig.organization,
      url: meta.url,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${metaConfig.site.url}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };

    // Add page-specific schema
    if (pageType === 'post' && data.post) {
      return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: data.post.title,
        description: data.post.excerpt || meta.description,
        image: data.post.featured_image || meta.image,
        datePublished: data.post.created_at,
        dateModified: data.post.updated_at,
        author: {
          '@type': 'Person',
          name: data.post.author || 'Markaba News'
        },
        publisher: baseSchema,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': meta.url
        }
      };
    }

    if (pageType === 'category' && data.category) {
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `أخبار ${data.category}`,
        description: meta.description,
        url: meta.url,
        mainEntity: {
          '@type': 'ItemList',
          name: `أخبار ${data.category}`,
          description: meta.description
        },
        isPartOf: baseSchema
      };
    }

    return baseSchema;
  }, [meta, pageType, data]);

  // Generate Open Graph data
  const openGraph = useMemo(() => ({
    title: meta.title,
    description: meta.description,
    type: meta.type || 'website',
    url: meta.url,
    image: meta.image,
    siteName: metaConfig.site.name,
    locale: meta.locale || metaConfig.defaults.locale,
    ...(meta.publishedTime && { publishedTime: meta.publishedTime }),
    ...(meta.modifiedTime && { modifiedTime: meta.modifiedTime }),
    ...(meta.author && { author: meta.author }),
    ...(meta.section && { section: meta.section })
  }), [meta]);

  // Generate Twitter Card data
  const twitterCard = useMemo(() => ({
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
    image: meta.image,
    site: metaConfig.social.twitter.site,
    creator: metaConfig.social.twitter.creator
  }), [meta]);

  // Generate robots meta
  const robots = useMemo(() => {
    const robotsConfig = metaConfig.robots;
    const parts = [];
    
    if (robotsConfig.index) parts.push('index');
    else parts.push('noindex');
    
    if (robotsConfig.follow) parts.push('follow');
    else parts.push('nofollow');
    
    return parts.join(', ');
  }, []);

  // Generate Google Bot specific meta
  const googleBot = useMemo(() => {
    const { googleBot } = metaConfig.robots;
    const parts = [];
    
    if (googleBot.index) parts.push('index');
    else parts.push('noindex');
    
    if (googleBot.follow) parts.push('follow');
    else parts.push('nofollow');
    
    if (googleBot.maxSnippet !== undefined) {
      parts.push(`max-snippet:${googleBot.maxSnippet}`);
    }
    
    if (googleBot.maxImagePreview) {
      parts.push(`max-image-preview:${googleBot.maxImagePreview}`);
    }
    
    if (googleBot.maxVideoPreview !== undefined) {
      parts.push(`max-video-preview:${googleBot.maxVideoPreview}`);
    }
    
    return parts.join(', ');
  }, []);

  return {
    meta,
    structuredData,
    openGraph,
    twitterCard,
    robots,
    googleBot,
    config: metaConfig
  };
};

export default useMeta;