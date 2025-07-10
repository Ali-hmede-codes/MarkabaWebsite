import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useContent } from '../../hooks/useContent';

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
  showHeader = true,
  showFooter = true,
  className = '',
  containerClassName = '',
}) => {
  const { content } = useContent();

  // Default SEO data
  const defaultSEO: SEOData = {
    title: title || (content?.site.name + ' - ' + content?.site.tagline) || 'أخبار مركبة - آخر الأخبار والتحديثات',
    description: description || content?.site.description || 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من أخبار مركبة.',
    keywords: ['أخبار', 'أخبار عاجلة', 'تحديثات', 'صحافة', 'أحداث جارية'],
    image: '/images/og-image.jpg',
    url: typeof window !== 'undefined' ? window.location.href : '',
    type: 'website',
  };

  const seoData = { ...defaultSEO, ...seo };

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        {seoData.keywords && (
          <meta name="keywords" content={seoData.keywords.join(', ')} />
        )}
        <meta name="author" content="NewsMarkaba" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={seoData.url} />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:type" content={seoData.type} />
        <meta property="og:url" content={seoData.url} />
        {seoData.image && <meta property="og:image" content={seoData.image} />}
        <meta property="og:site_name" content={content?.site.name || 'أخبار مركبة'} />
        <meta property="og:locale" content="ar_SA" />
        {seoData.publishedTime && (
          <meta property="article:published_time" content={seoData.publishedTime} />
        )}
        {seoData.modifiedTime && (
          <meta property="article:modified_time" content={seoData.modifiedTime} />
        )}
        {seoData.author && (
          <meta property="article:author" content={seoData.author} />
        )}
        {seoData.section && (
          <meta property="article:section" content={seoData.section} />
        )}

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        {seoData.image && <meta name="twitter:image" content={seoData.image} />}
        <meta name="twitter:site" content="@NewsMarkaba" />
        <meta name="twitter:creator" content="@NewsMarkaba" />

        {/* Favicon and App Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Theme Color */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />

        {/* Language and Direction */}
        <html lang="ar" dir="rtl" />

        {/* Preconnect to External Domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* RSS Feed */}
        <link 
          rel="alternate" 
          type="application/rss+xml" 
          title={`${content?.site.name || 'أخبار مركبة'} RSS Feed`}
          href="/api/rss" 
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: content?.site.name || 'أخبار مركبة',
              url: seoData.url,
              logo: {
                '@type': 'ImageObject',
                url: '/images/logo.png',
              },
              sameAs: [
                'https://twitter.com/NewsMarkaba',
                'https://facebook.com/NewsMarkaba',
                'https://instagram.com/NewsMarkaba',
              ],
            }),
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