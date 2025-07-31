import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useContent } from '../../hooks/useContent';
import { useMeta } from '../../hooks/useMeta';
import metaConfig from '../../config/meta.config';

interface SEOData {
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
}

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  seo?: SEOData;
  pageType?: 'home' | 'category' | 'post' | 'search' | 'about' | 'contact' | 'custom';
  pageData?: Record<string, any>;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  containerClassName?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  seo,
  pageType = 'custom',
  pageData = {},
  showHeader = true,
  showFooter = true,
  className = '',
  containerClassName = '',
}) => {
  const { content } = useContent();

  // Use the meta hook for comprehensive SEO management
  const { meta, structuredData, openGraph, twitterCard, robots, googleBot } = useMeta({
    pageType,
    data: pageData,
    customMeta: {
      title: title || seo?.title,
      description: description || seo?.description,
      ...seo
    }
  });

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    
    // Remove leading slashes
    const cleanPath = imagePath.replace(/^\/+/, '');
    
    // For development, use the backend server URL
    if (process.env.NODE_ENV === 'development') {
      return `http://api.markaba.news/${cleanPath}`;
    }
    
    // For production, use the configured site URL
    return `${metaConfig.site.url}/${cleanPath}`;
  };

  // Get post-specific data for meta tags
  const getPostMetaData = () => {
    if (pageType !== 'post' || !pageData.post) return null;
    
    const post = pageData.post;
    return {
      title: post.title_ar || post.title,
      description: post.meta_description_ar || post.meta_description || post.excerpt_ar || post.excerpt,
      keywords: post.meta_keywords_ar || post.meta_keywords || '',
      author: post.author || metaConfig.site.nameEn,
      image: post.featured_image ? getImageUrl(post.featured_image) : '',
      url: `${metaConfig.site.url}/post/${post.slug}`,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      category: post.category,
      tags: post.meta_keywords_ar ? post.meta_keywords_ar.split(',').map((tag: string) => tag.trim()) : []
    };
  };

  const postMeta = getPostMetaData();
  const seoData = seo ? { ...meta, ...seo } : meta;

  // Render Basic Meta Tags
  const renderBasicMetaTags = () => (
    <>
      <title>
        {postMeta ? `${postMeta.title} - مركبا` : seoData.title}
      </title>
      <meta name="description" content={postMeta?.description || seoData.description} />
      <meta name="keywords" content={
        postMeta?.keywords || 
        (Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords || '')
      } />
      <meta name="author" content={postMeta?.author || metaConfig.site.nameEn} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={googleBot} />
      <meta name="bingbot" content="index, follow" />
      <link rel="canonical" href={postMeta?.url || seoData.url} />
    </>
  );

  // Render Open Graph Meta Tags
  const renderOpenGraphTags = () => {
    if (postMeta) {
      return (
        <>
          <meta property="og:type" content="article" />
          <meta property="og:title" content={postMeta.title} />
          <meta property="og:description" content={postMeta.description} />
          <meta property="og:url" content={postMeta.url} />
          <meta property="og:site_name" content={metaConfig.site.name} />
          <meta property="og:locale" content="ar_AR" />
          
          {/* Post Image */}
          {postMeta.image && (
            <>
              <meta property="og:image" content={postMeta.image} />
              <meta property="og:image:secure_url" content={postMeta.image.replace('http:', 'https:')} />
              <meta property="og:image:type" content="image/jpeg" />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
              <meta property="og:image:alt" content={postMeta.title} />
            </>
          )}
          
          {/* Article specific tags */}
          <meta property="article:published_time" content={postMeta.publishedTime} />
          <meta property="article:modified_time" content={postMeta.modifiedTime} />
          <meta property="article:author" content={postMeta.author} />
          {postMeta.category && <meta property="article:section" content={postMeta.category} />}
          
          {/* Article tags */}
          {postMeta.tags.map((tag: string, index: number) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
          
          {/* Facebook App ID */}
          {metaConfig.social.facebook.appId && (
            <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
          )}
        </>
      );
    }
    
    // Default Open Graph tags for non-post pages
    return (
      <>
        <meta property="og:title" content={openGraph.title} />
        <meta property="og:description" content={openGraph.description} />
        <meta property="og:type" content={openGraph.type} />
        <meta property="og:url" content={openGraph.url} />
        <meta property="og:site_name" content={openGraph.siteName} />
        <meta property="og:locale" content={openGraph.locale} />
        {openGraph.image && <meta property="og:image" content={openGraph.image} />}
        {metaConfig.social.facebook.appId && (
          <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
        )}
      </>
    );
  };

  // Render Twitter Card Meta Tags
  const renderTwitterCardTags = () => {
    if (postMeta) {
      return (
        <>
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={postMeta.title} />
          <meta name="twitter:description" content={postMeta.description} />
          <meta name="twitter:site" content={metaConfig.social.twitter.site} />
          <meta name="twitter:creator" content={metaConfig.social.twitter.creator} />
          
          {postMeta.image && (
            <>
              <meta name="twitter:image" content={postMeta.image} />
              <meta name="twitter:image:alt" content={postMeta.title} />
            </>
          )}
        </>
      );
    }
    
    // Default Twitter Card tags for non-post pages
    return (
      <>
        <meta name="twitter:card" content={twitterCard.card} />
        <meta name="twitter:title" content={twitterCard.title} />
        <meta name="twitter:description" content={twitterCard.description} />
        <meta name="twitter:site" content={twitterCard.site} />
        <meta name="twitter:creator" content={twitterCard.creator} />
        {twitterCard.image && <meta name="twitter:image" content={twitterCard.image} />}
      </>
    );
  };

  // Render Additional Social Media Tags
  const renderAdditionalSocialTags = () => (
    <>
      {/* LinkedIn */}
      <meta name="linkedin:owner" content={metaConfig.social.linkedin} />
      
      {/* Pinterest */}
      <meta name="pinterest-rich-pin" content="true" />
      
      {/* Mobile and App Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={metaConfig.site.name} />
    </>
  );

  // Render Favicon and App Icons
  const renderFaviconTags = () => (
    <>
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </>
  );

  // Render Theme and App Meta Tags
  const renderThemeTags = () => (
    <>
      <meta name="theme-color" content={metaConfig.additional.themeColor} />
      <meta name="msapplication-TileColor" content={metaConfig.additional.msApplicationTileColor} />
      <meta name="application-name" content={metaConfig.additional.applicationName} />
      <meta name="msapplication-tooltip" content={metaConfig.additional.msApplicationTooltip} />
    </>
  );

  // Render SEO and Verification Tags
  const renderSEOTags = () => (
    <>
      <meta name="language" content="Arabic" />
      <meta name="geo.region" content={metaConfig.site.country} />
      <meta name="geo.country" content={metaConfig.site.region} />
      <meta name="distribution" content={metaConfig.additional.distribution} />
      <meta name="rating" content={metaConfig.additional.rating} />
      
      {/* Google Search Console Verification */}
      {metaConfig.analytics.googleSearchConsole && (
        <meta name="google-site-verification" content={metaConfig.analytics.googleSearchConsole} />
      )}
    </>
  );

  // Render Analytics Scripts
  const renderAnalytics = () => {
    if (!metaConfig.analytics.googleAnalytics) return null;
    
    return (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${metaConfig.analytics.googleAnalytics}`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${metaConfig.analytics.googleAnalytics}');
            `,
          }}
        />
      </>
    );
  };

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        {renderBasicMetaTags()}
        
        {/* Open Graph Meta Tags */}
        {renderOpenGraphTags()}
        
        {/* Twitter Card Meta Tags */}
        {renderTwitterCardTags()}
        
        {/* Additional Social Media Tags */}
        {renderAdditionalSocialTags()}
        
        {/* Favicon and App Icons */}
        {renderFaviconTags()}
        
        {/* Theme and App Meta Tags */}
        {renderThemeTags()}
        
        {/* SEO and Verification Tags */}
        {renderSEOTags()}
        
        {/* Language and Direction */}
        <html lang="ar" dir="rtl" />
        
        {/* Preconnect to External Domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* RSS Feed */}
        <link 
          rel="alternate" 
          type="application/rss+xml" 
          title={`${metaConfig.site.name} RSS Feed`}
          href="/api/rss" 
        />
        
        {/* Analytics */}
        {renderAnalytics()}
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </Head>

      <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`} dir="rtl">
        {/* Header */}
        {showHeader && <Header />}

        {/* Main Content */}
        <main className={`flex-1 ${containerClassName}`}>
          {children}
        </main>

        {/* Footer */}
        {showFooter && <Footer />}

        {/* Toast Notifications */}
        <Toaster
          position="top-left"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Noto Sans Arabic, Arial, sans-serif',
              direction: 'rtl',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </>
  );
};

export default Layout;