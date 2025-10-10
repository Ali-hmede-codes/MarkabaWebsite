import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import SimpleMeta from '../Meta/SimpleMeta';

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
  keywords?: string;
  seo?: SEOData;
  pageType?: 'home' | 'category' | 'search' | 'about' | 'contact' | 'advertise' | 'custom';
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
  keywords,
  seo,
  pageType = 'custom',
  pageData = {},
  showHeader = true,
  showFooter = true,
  className = '',
  containerClassName = '',
}) => {
  // Generate canonical URL based on current page
  const getCanonicalUrl = () => {
    if (seo?.url) return seo.url;
    
    // Generate canonical URL based on page type and data
    const baseUrl = 'https://markaba.news';
    
    switch (pageType) {
      case 'home':
        return baseUrl;
      case 'category':
        return pageData?.slug ? `${baseUrl}/category/${pageData.slug}` : baseUrl;
      case 'search':
        return `${baseUrl}/search`;
      case 'about':
        return `${baseUrl}/about`;
      case 'contact':
        return `${baseUrl}/contact`;
      case 'advertise':
        return `${baseUrl}/advertise`;
      default:
        return typeof window !== 'undefined' ? window.location.href : baseUrl;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-white ${className}`}>
      {(title || description || keywords || seo) && (
        <SimpleMeta 
          title={seo?.title || title}
          description={seo?.description || description}
          keywords={Array.isArray(seo?.keywords) ? seo.keywords.join(', ') : keywords}
          canonical={getCanonicalUrl()}
          image={seo?.image}
          structuredData={seo?.structuredData}
        />
      )}
      {showHeader && <Header />}
      <main className={`flex-grow ${containerClassName}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      <Toaster position="top-right" />
    </div>
  );
}


export default Layout;