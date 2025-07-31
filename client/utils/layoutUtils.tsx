import React from 'react';
import metaConfig from '../config/meta.config';

/**
 * Helper function to construct proper image URLs
 * Used by both Layout and PostLayout components
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // Remove leading slashes
  const cleanPath = imagePath.replace(/^\/+/, '');
  
  // For development, use the backend server URL
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:5000/${cleanPath}`;
  }
  
  // For production, use the configured site URL
  return `${metaConfig.site.url}/${cleanPath}`;
};

/**
 * Common meta tag rendering functions
 */
export const renderCommonMetaTags = () => ({
  // Favicon and App Icons
  renderFaviconTags: () => (
    <React.Fragment>
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </React.Fragment>
  ),

  // Theme and App Meta Tags
  renderThemeTags: () => (
    <React.Fragment>
      <meta name="theme-color" content={metaConfig.additional.themeColor} />
      <meta name="msapplication-TileColor" content={metaConfig.additional.msApplicationTileColor} />
      <meta name="application-name" content={metaConfig.additional.applicationName} />
      <meta name="msapplication-tooltip" content={metaConfig.additional.msApplicationTooltip} />
    </React.Fragment>
  ),

  // SEO and Verification Tags
  renderSEOTags: () => (
    <React.Fragment>
      <meta name="geo.region" content={metaConfig.site.country} />
      <meta name="geo.country" content={metaConfig.site.region} />
      <meta name="distribution" content={metaConfig.additional.distribution} />
      <meta name="rating" content={metaConfig.additional.rating} />
      
      {/* Google Search Console Verification */}
      {metaConfig.analytics.googleSearchConsole && (
        <meta name="google-site-verification" content={metaConfig.analytics.googleSearchConsole} />
      )}
    </React.Fragment>
  ),

  // Additional Social Media Tags
  renderAdditionalSocialTags: () => (
    <React.Fragment>
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
    </React.Fragment>
  ),

  // Analytics Scripts
  renderAnalytics: () => {
    if (!metaConfig.analytics.googleAnalytics) return null;
    
    return (
      <React.Fragment>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${metaConfig.analytics.googleAnalytics}`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${metaConfig.analytics.googleAnalytics}');`
          }}
        />
      </React.Fragment>
    );
  }
});

/**
 * Common Toaster configuration for both layouts
 */
export const toasterConfig = {
  position: 'top-left' as const,
  toastOptions: {
    duration: 4000,
    style: {
      background: '#ffffff',
      color: '#111827',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'Noto Sans Arabic, Arial, sans-serif',
      direction: 'rtl' as const,
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
  },
};