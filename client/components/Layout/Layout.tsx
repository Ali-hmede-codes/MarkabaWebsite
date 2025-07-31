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

  // Fallback to legacy seo prop if provided
  const seoData = seo ? { ...meta, ...seo } : meta;

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        {pageType === 'post' && pageData.post ? (
          <title>{pageData.post.title_ar || pageData.post.title} - مركبا</title>
        ) : pageType !== 'post' && (
          <title>{seoData.title}</title>
        )}
        {pageType === 'post' && pageData.post ? (
          <>
            <meta name="description" content={pageData.post.meta_description_ar || pageData.post.meta_description || pageData.post.excerpt_ar || pageData.post.excerpt} />
            <meta name="keywords" content={pageData.post.meta_keywords_ar || pageData.post.meta_keywords || ''} />
            <meta name="author" content={pageData.post.author || metaConfig.site.nameEn} />
          </>
        ) : (
          <>
            <meta name="description" content={seoData.description} />
            {seoData.keywords && (
              <meta name="keywords" content={Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords} />
            )}
          </>
        )}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content={robots} />
        <meta name="googlebot" content={googleBot} />
        <meta name="bingbot" content="index, follow" />
        <link rel="canonical" href={seoData.url} />
        
        {/* Google Search Console Verification */}
        {metaConfig.analytics.googleSearchConsole && (
          <meta name="google-site-verification" content={metaConfig.analytics.googleSearchConsole} />
        )}
        
        {/* Additional SEO Meta Tags */}
        <meta name="language" content="Arabic" />
        <meta name="geo.region" content={metaConfig.site.country} />
        <meta name="geo.country" content={metaConfig.site.region} />
        <meta name="distribution" content={metaConfig.additional.distribution} />
        <meta name="rating" content={metaConfig.additional.rating} />
        <meta name="application-name" content={metaConfig.additional.applicationName} />
        <meta name="msapplication-tooltip" content={metaConfig.additional.msApplicationTooltip} />

        {/* Open Graph Meta Tags */}
        {pageType === 'post' && pageData.post ? (
          <>
            <meta property="og:type" content="article" />
            <meta property="og:title" content={pageData.post.title_ar || pageData.post.title} />
            <meta property="og:description" content={pageData.post.meta_description_ar || pageData.post.meta_description || pageData.post.excerpt_ar || pageData.post.excerpt} />
            <meta property="og:url" content={`${metaConfig.site.url}/post/${pageData.post.slug}`} />
            <meta property="og:site_name" content="مركبا - المنصة الإخبارية" />
            <meta property="og:locale" content="ar_AR" />
            {metaConfig.social.facebook.appId && (
              <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
            )}
            {pageData.post.featured_image && (
              <>
                <meta property="og:image" content={`${metaConfig.site.url.replace(':3443', ':5000').replace('https:', 'http:')}/${pageData.post.featured_image.replace(/^\/+/, '')}`} />
                <meta property="og:image:secure_url" content={`${metaConfig.site.url.replace(':3443', ':5000').replace('https:', 'http:')}/${pageData.post.featured_image.replace(/^\/+/, '')}`} />
                <meta property="og:image:type" content="image/jpeg" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={pageData.post.title_ar || pageData.post.title} />
              </>
            )}
            <meta property="article:published_time" content={pageData.post.created_at} />
            <meta property="article:modified_time" content={pageData.post.updated_at} />
            {pageData.post.author && (
              <meta property="article:author" content={pageData.post.author} />
            )}
            {pageData.post.category && (
               <meta property="article:section" content={pageData.post.category} />
             )}
             {pageData.post.meta_keywords_ar && pageData.post.meta_keywords_ar.split(',').map((tag: string, index: number) => (
               <meta key={index} property="article:tag" content={tag.trim()} />
             ))}
            
            {/* Facebook specific tags */}
            <meta property="og:site_name" content={metaConfig.site.name} />
            <meta property="og:locale" content="ar_AR" />
            {metaConfig.social.facebook.appId && (
              <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
            )}
            
            {/* Additional social media tags */}
            <meta property="og:type" content="article" />
            <meta name="robots" content="index, follow" />
            <meta name="googlebot" content="index, follow" />
          </>
        ) : pageType !== 'post' && (
          <>
            <meta property="og:title" content={openGraph.title} />
            <meta property="og:description" content={openGraph.description} />
            <meta property="og:type" content={openGraph.type} />
            <meta property="og:url" content={openGraph.url} />
            {openGraph.image && <meta property="og:image" content={openGraph.image} />}
            <meta property="og:site_name" content={openGraph.siteName} />
            <meta property="og:locale" content={openGraph.locale} />
            {metaConfig.social.facebook.appId && (
              <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
            )}
            {openGraph.publishedTime && (
              <meta property="article:published_time" content={openGraph.publishedTime} />
            )}
            {openGraph.modifiedTime && (
              <meta property="article:modified_time" content={openGraph.modifiedTime} />
            )}
            {openGraph.author && (
              <meta property="article:author" content={openGraph.author} />
            )}
            {openGraph.section && (
              <meta property="article:section" content={openGraph.section} />
            )}
          </>
        )}
        
        {/* Global Open Graph tags that should always be present - Only for non-post pages */}
        {pageType !== 'post' && (
          <>
            <meta property="og:site_name" content={openGraph.siteName} />
            <meta property="og:locale" content={openGraph.locale} />
            {metaConfig.social.facebook.appId && (
              <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
            )}
          </>
        )}

        {/* Twitter Card Meta Tags */}
        {pageType === 'post' && pageData.post ? (
          <>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageData.post.title_ar || pageData.post.title} />
            <meta name="twitter:description" content={pageData.post.meta_description_ar || pageData.post.meta_description || pageData.post.excerpt_ar || pageData.post.excerpt} />
            {pageData.post.featured_image && (
              <>
                <meta name="twitter:image" content={`${metaConfig.site.url.replace(':3443', ':5000').replace('https:', 'http:')}/${pageData.post.featured_image.replace(/^\/+/, '')}`} />
                <meta name="twitter:image:alt" content={pageData.post.title_ar || pageData.post.title} />
              </>
            )}
            <meta name="twitter:site" content={metaConfig.social.twitter.site} />
             <meta name="twitter:creator" content={metaConfig.social.twitter.creator} />
            
            {/* LinkedIn specific tags */}
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            
            {/* WhatsApp and Telegram sharing */}
            <meta property="og:image:type" content="image/jpeg" />
            
            {/* Pinterest */}
             <meta name="pinterest-rich-pin" content="true" />
             
             {/* WhatsApp and Telegram specific */}
             <meta property="og:image:secure_url" content={`${metaConfig.site.url}/${pageData.post.featured_image?.replace(/^\/+/, '') || 'images/default-og.jpg'}`} />
             
             {/* LinkedIn specific */}
             <meta name="linkedin:owner" content={metaConfig.social.linkedin} />
             
             {/* Additional sharing platforms */}
             <meta name="format-detection" content="telephone=no" />
             <meta name="mobile-web-app-capable" content="yes" />
             <meta name="apple-mobile-web-app-capable" content="yes" />
             <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          </>
        ) : pageType !== 'post' && (
          <>
            <meta name="twitter:card" content={twitterCard.card} />
            <meta name="twitter:title" content={twitterCard.title} />
            <meta name="twitter:description" content={twitterCard.description} />
            {twitterCard.image && <meta name="twitter:image" content={twitterCard.image} />}
          </>
        )}
        
        {/* Global Twitter tags that should always be present */}
        <meta name="twitter:site" content={twitterCard.site} />
        <meta name="twitter:creator" content={twitterCard.creator} />

        {/* Favicon and App Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Theme Color and Mobile App */}
        <meta name="theme-color" content={metaConfig.additional.themeColor} />
        <meta name="msapplication-TileColor" content={metaConfig.additional.msApplicationTileColor} />
        <meta name="mobile-web-app-capable" content={metaConfig.additional.appleMobileWebAppCapable} />
        <meta name="apple-mobile-web-app-status-bar-style" content={metaConfig.additional.appleMobileWebAppStatusBarStyle} />
        <meta name="apple-mobile-web-app-title" content={metaConfig.additional.appleMobileWebAppTitle} />

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
        {metaConfig.analytics.googleAnalytics && (
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
        )}

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