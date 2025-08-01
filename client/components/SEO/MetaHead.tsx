/**
 * Enhanced Meta Head Component
 * Ensures proper meta tag injection during SSR and build time
 */

import React from 'react';
import Head from 'next/head';
import { generateMetaTags, generateStructuredData, MetaInjectionData } from '../../utils/metaInjector';
import metaConfig from '../../config/meta.config';

interface MetaHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  locale?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
  alternateLanguages?: { hreflang: string; href: string }[];
  structuredData?: any;
}

const MetaHead: React.FC<MetaHeadProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  locale = 'ar_AR',
  siteName,
  twitterCard = 'summary_large_image',
  twitterSite,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noIndex = false,
  canonical,
  alternateLanguages = [],
  structuredData
}) => {
  // Prepare meta injection data
  const metaData: MetaInjectionData = {
    title,
    description,
    keywords,
    image,
    url: url || (typeof window !== 'undefined' ? window.location.href : metaConfig.site.url),
    type,
    locale,
    siteName: siteName || metaConfig.site.name,
    twitterCard,
    twitterSite: twitterSite || '@markaba_news',
    author: author || metaConfig.site.nameEn,
    publishedTime,
    modifiedTime,
    section,
    tags
  };

  // Generate meta tags
  const metaTags = generateMetaTags(metaData);
  
  // Generate structured data
  const defaultStructuredData = generateStructuredData(metaData);
  const finalStructuredData = structuredData || JSON.parse(defaultStructuredData);

  // Robots meta content
  const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Head>
      {/* Title */}
      <title>{title}</title>
      
      {/* Basic Meta Tags */}
      <meta name="description" content={description} />
      <meta name="author" content={author || metaConfig.site.nameEn} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
      <meta name="language" content="Arabic" />
      <meta httpEquiv="content-language" content="ar" />
      
      {/* Keywords */}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || url || metaConfig.site.url} />
      
      {/* Alternate Languages */}
      {alternateLanguages.map((alt, index) => (
        <link key={index} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || metaConfig.site.url} />
      <meta property="og:site_name" content={siteName || metaConfig.site.name} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content="en_US" />
      
      {/* Open Graph Image */}
      {image && (
        <>
          <meta property="og:image" content={image} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:alt" content={title} />
        </>
      )}
      
      {/* Article-specific Open Graph */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Facebook App ID */}
      {metaConfig.social.facebook.appId && (
        <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:site" content={twitterSite || '@markaba_news'} />
      <meta name="twitter:creator" content={twitterSite || '@markaba_news'} />
      
      {/* Twitter Image */}
      {image && (
        <meta name="twitter:image" content={image} />
      )}
      
      {/* Additional Social and Mobile Meta Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName || metaConfig.site.name} />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      
      {/* RSS Feed */}
      <link 
        rel="alternate" 
        type="application/rss+xml" 
        title={`${metaConfig.site.name} RSS Feed`}
        href="/api/rss" 
      />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalStructuredData, null, 2)
        }}
      />
      
      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${metaConfig.site.url}/#website`,
            "url": metaConfig.site.url,
            "name": metaConfig.site.name,
            "description": metaConfig.site.description,
            "inLanguage": "ar",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${metaConfig.site.url}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          }, null, 2)
        }}
      />
    </Head>
  );
};

export default MetaHead;