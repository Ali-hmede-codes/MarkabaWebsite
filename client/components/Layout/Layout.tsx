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
  keywords,
  seo,
  pageType = 'custom',
  pageData = {},
  showHeader = true,
  showFooter = true,
  className = '',
  containerClassName = '',
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {(title || description || keywords) && (
        <SimpleMeta 
          title={title}
          description={description}
          keywords={keywords}
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