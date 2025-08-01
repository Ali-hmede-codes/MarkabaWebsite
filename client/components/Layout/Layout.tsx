import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useMeta } from '../../hooks/useMeta';
import metaConfig from '../../config/meta.config';
import { renderCommonMetaTags, toasterConfig } from '../../utils/layoutUtils';
import MetaHead from '../SEO/MetaHead';

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
  structuredData?: any;
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

  // Debug logging
  console.log('Layout Debug:', {
    pageType,
    seo,
    meta,
    seoData,
    title: seoData.title,
    description: seoData.description
  });

  // Render Basic Meta Tags (excluding viewport and charset - handled by _document.tsx)
  const renderBasicMetaTags = () => (
    <>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={
        Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords || ''
      } />
      <meta name="author" content={metaConfig.site.nameEn} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={googleBot} />
      <meta name="bingbot" content="index, follow" />
      <meta name="referrer" content="origin-when-cross-origin" />
      <meta name="language" content="Arabic" />
      <meta httpEquiv="content-language" content="ar" />
      <link rel="canonical" href={seoData.url} />
      <link rel="home" href={metaConfig.site.url} />
    </>
  );

  // Render Open Graph Meta Tags (page-specific only)
  const renderOpenGraphTags = () => (
    <>
      <meta property="og:title" content={openGraph.title} />
      <meta property="og:description" content={openGraph.description} />
      <meta property="og:type" content={openGraph.type} />
      <meta property="og:url" content={openGraph.url} />
      <meta property="og:site_name" content={metaConfig.site.name} />
      <meta property="og:locale" content={metaConfig.site.language} />
      <meta property="og:locale:alternate" content="en_US" />
      {openGraph.image && <meta property="og:image" content={openGraph.image} />}
      {metaConfig.social.facebook.appId && (
        <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
      )}
    </>
  );

  // Render Twitter Card Meta Tags (page-specific only)
  const renderTwitterCardTags = () => (
    <>
      <meta name="twitter:card" content={twitterCard.card} />
      <meta name="twitter:title" content={twitterCard.title} />
      <meta name="twitter:description" content={twitterCard.description} />
      {twitterCard.image && <meta name="twitter:image" content={twitterCard.image} />}
    </>
  );

  // Get common meta tag renderers
  const commonMetaTags = renderCommonMetaTags();

  return (
    <>
      <MetaHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        image={seoData.image}
        url={seoData.url}
        type={seoData.type as 'website' | 'article'}
        locale={metaConfig.site.language}
        siteName={metaConfig.site.name}
        twitterCard={twitterCard.card as 'summary' | 'summary_large_image'}
        twitterSite={metaConfig.social.twitter.handle}
        author={seoData.author}
        publishedTime={seoData.publishedTime}
        modifiedTime={seoData.modifiedTime}
        section={seoData.section}
        tags={seoData.keywords}
        noIndex={robots.includes('noindex')}
        canonical={seoData.url}
        structuredData={seo?.structuredData || structuredData}
      />

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