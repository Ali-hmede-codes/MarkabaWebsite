import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useMeta } from '../../hooks/useMeta';
import metaConfig from '../../config/meta.config';
import { renderCommonMetaTags, toasterConfig } from '../../utils/layoutUtils';

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
  pageType?: 'home' | 'category' | 'search' | 'about' | 'contact' | 'custom';
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

  const seoData = seo ? { ...meta, ...seo } : meta;

  // Render Basic Meta Tags
  const renderBasicMetaTags = () => (
    <>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={
        Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords || ''
      } />
      <meta name="author" content={metaConfig.site.nameEn} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={googleBot} />
      <meta name="bingbot" content="index, follow" />
      <link rel="canonical" href={seoData.url} />
    </>
  );

  // Render Open Graph Meta Tags
  const renderOpenGraphTags = () => (
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

  // Render Twitter Card Meta Tags
  const renderTwitterCardTags = () => (
    <>
      <meta name="twitter:card" content={twitterCard.card} />
      <meta name="twitter:title" content={twitterCard.title} />
      <meta name="twitter:description" content={twitterCard.description} />
      <meta name="twitter:site" content={twitterCard.site} />
      <meta name="twitter:creator" content={twitterCard.creator} />
      {twitterCard.image && <meta name="twitter:image" content={twitterCard.image} />}
    </>
  );

  // Get common meta tag renderers
  const commonMetaTags = renderCommonMetaTags();

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
        {commonMetaTags.renderAdditionalSocialTags()}
        
        {/* Favicon and App Icons */}
        {commonMetaTags.renderFaviconTags()}
        
        {/* Theme and App Meta Tags */}
        {commonMetaTags.renderThemeTags()}
        
        {/* SEO and Verification Tags */}
        {commonMetaTags.renderSEOTags()}
        
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
        {commonMetaTags.renderAnalytics()}
        
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
        <Toaster {...toasterConfig} />
      </div>
    </>
  );
};

export default Layout;