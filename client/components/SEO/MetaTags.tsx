import React from 'react';
import Head from 'next/head';
import { useMeta } from '../../hooks/useMeta';
import metaConfig from '../../config/meta.config';

interface MetaTagsProps {
  pageType?: 'home' | 'category' | 'post' | 'search' | 'about' | 'contact' | 'custom';
  pageData?: Record<string, unknown>;
  customMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: string;
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  language?: 'ar' | 'en';
}

const MetaTags: React.FC<MetaTagsProps> = ({
  pageType = 'custom',
  pageData = {},
  customMeta = {},
  language = 'ar'
}) => {
  const { meta, structuredData, openGraph, twitterCard, robots, googleBot } = useMeta({
    pageType,
    data: pageData,
    customMeta,
    language
  });

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && (
        <meta name="keywords" content={meta.keywords.join(', ')} />
      )}
      <meta name="author" content={meta.author || metaConfig.site.nameEn} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={googleBot} />
      <meta name="bingbot" content="index, follow" />
      <link rel="canonical" href={meta.url} />
      
      {/* Google Search Console Verification */}
      {metaConfig.analytics.googleSearchConsole && (
        <meta name="google-site-verification" content={metaConfig.analytics.googleSearchConsole} />
      )}
      
      {/* Additional SEO Meta Tags */}
      <meta name="language" content={language === 'ar' ? 'Arabic' : 'English'} />
      <meta name="geo.region" content={metaConfig.site.country} />
      <meta name="geo.country" content={metaConfig.site.region} />
      <meta name="distribution" content={metaConfig.additional.distribution} />
      <meta name="rating" content={metaConfig.additional.rating} />
      <meta name="application-name" content={metaConfig.additional.applicationName} />
      <meta name="msapplication-tooltip" content={metaConfig.additional.msApplicationTooltip} />
      
      {/* Open Graph Meta Tags */}
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
      {customMeta.tags && customMeta.tags.map((tag: string, index: number) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard.card} />
      <meta name="twitter:title" content={twitterCard.title} />
      <meta name="twitter:description" content={twitterCard.description} />
      {twitterCard.image && <meta name="twitter:image" content={twitterCard.image} />}
      <meta name="twitter:site" content={twitterCard.site} />
      <meta name="twitter:creator" content={twitterCard.creator} />
      
      {/* Theme Color and Mobile App */}
      <meta name="theme-color" content={metaConfig.additional.themeColor} />
      <meta name="msapplication-TileColor" content={metaConfig.additional.msApplicationTileColor} />
      <meta name="apple-mobile-web-app-capable" content={metaConfig.additional.appleMobileWebAppCapable} />
      <meta name="apple-mobile-web-app-status-bar-style" content={metaConfig.additional.appleMobileWebAppStatusBarStyle} />
      <meta name="apple-mobile-web-app-title" content={metaConfig.additional.appleMobileWebAppTitle} />
      
      {/* Language and Direction */}
      <meta name="dir" content={language === 'ar' ? 'rtl' : 'ltr'} />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      
      {/* RSS Feed */}
      <link 
        rel="alternate" 
        type="application/rss+xml" 
        title={`${metaConfig.site.name} RSS Feed`}
        href="/api/rss" 
      />
      
      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
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
      
      {/* Facebook Pixel */}
      {metaConfig.analytics.facebookPixel && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaConfig.analytics.facebookPixel}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </Head>
  );
};

export default MetaTags;