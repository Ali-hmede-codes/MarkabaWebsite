import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import metaConfig from '../../config/meta.config';
import { getImageUrl } from '../../utils/imageUtils';
import { renderCommonMetaTags, toasterConfig } from '../../utils/layoutUtils';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'author';
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name_ar: string;
  slug: string;
  description_ar?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

interface PostData {
  id: number;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  excerpt?: string;
  excerpt_ar?: string;
  meta_description?: string;
  meta_description_ar?: string;
  meta_keywords?: string;
  meta_keywords_ar?: string;
  featured_image?: string;
  slug: string;
  author?: User;
  category?: Category;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface PostLayoutProps {
  children: ReactNode;
  post?: PostData;
  title?: string;
  description?: string;
  className?: string;
  containerClassName?: string;
}

const PostLayout: React.FC<PostLayoutProps> = ({
  children,
  post,
  title,
  description,
  className = '',
  containerClassName = '',
}) => {
  // Get common meta tag renderers
  const commonMetaTags = renderCommonMetaTags();

  // Get post meta data
  const postTitle = post ? (post.title_ar || post.title) : (title || 'مركبا');
  const postDescription = post ? (post.meta_description_ar || post.meta_description || post.excerpt_ar || post.excerpt || '') : (description || '');
  const postKeywords = post ? (post.meta_keywords_ar || post.meta_keywords || '') : '';
  const postAuthor = post ? (post.author ? post.author.username : metaConfig.site.nameEn) : metaConfig.site.nameEn;
  const postImage = post && post.featured_image ? getImageUrl(post.featured_image) : `${metaConfig.site.url}/images/og-default.svg`;
  const postUrl = post ? `${metaConfig.site.url}/post/${post.slug}` : metaConfig.site.url;
  const postTags = post && post.meta_keywords_ar ? post.meta_keywords_ar.split(',').map(tag => tag.trim()) : [];

  // Render post-specific meta tags
  const renderPostMetaTags = () => (
    <>
      {/* Basic Meta Tags */}
      <title>{postTitle} - مركبا</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
      <meta name="description" content={postDescription} />
      <meta name="keywords" content={postKeywords} />
      <meta name="author" content={postAuthor} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <link rel="canonical" href={postUrl} />
      
      {/* Language and Direction */}
      <meta name="language" content="Arabic" />
      <meta httpEquiv="content-language" content="ar" />
    </>
  );

  // Render Open Graph meta tags
  const renderOpenGraphTags = () => (
    <>
      <meta property="og:type" content="article" />
      <meta property="og:title" content={postTitle} />
      <meta property="og:description" content={postDescription} />
      <meta property="og:url" content={postUrl} />
      <meta property="og:site_name" content={metaConfig.site.name} />
      <meta property="og:locale" content="ar_AR" />
      
      {/* Post Image - Critical for social sharing */}
      {postImage && (
        <>
          <meta property="og:image" content={postImage} />
          <meta property="og:image:secure_url" content={postImage.replace('http:', 'https:')} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={postTitle} />
        </>
      )}
      
      {/* Article specific tags */}
      {post && <meta property="article:published_time" content={post.created_at} />}
      {post && <meta property="article:modified_time" content={post.updated_at} />}
      <meta property="article:author" content={postAuthor} />
      {post && post.category && <meta property="article:section" content={post.category.name_ar || 'News'} />}
      
      {/* Article tags */}
      {postTags.map((tag: string, index: number) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Facebook App ID */}
      {metaConfig.social.facebook.appId && (
        <meta property="fb:app_id" content={metaConfig.social.facebook.appId} />
      )}
    </>
  );

  // Render Twitter Card meta tags
  const renderTwitterCardTags = () => (
    <>
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={postTitle} />
      <meta name="twitter:description" content={postDescription} />
      <meta name="twitter:site" content={metaConfig.social.twitter.site} />
      <meta name="twitter:creator" content={metaConfig.social.twitter.creator} />
      
      {postImage && (
        <>
          <meta name="twitter:image" content={postImage} />
          <meta name="twitter:image:alt" content={postTitle} />
        </>
      )}
    </>
  );



  // Generate JSON-LD structured data for the post
  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": postTitle,
      "description": postDescription,
      "image": postImage ? [postImage] : [],
      "datePublished": post?.created_at || new Date().toISOString(),
      "dateModified": post?.updated_at || new Date().toISOString(),
      "author": {
        "@type": "Person",
        "name": postAuthor
      },
      "publisher": {
        "@type": "Organization",
        "name": metaConfig.site.name,
        "logo": {
          "@type": "ImageObject",
          "url": `${metaConfig.site.url}/images/logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": postUrl
      },
      "url": postUrl,
      "articleSection": post?.category?.name_ar || "News",
      "keywords": postTags,
      "inLanguage": "ar"
    };

    return structuredData;
  };

  return (
    <>
      <Head>
        {/* Post Meta Tags */}
        {renderPostMetaTags()}
        
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
            __html: JSON.stringify(generateStructuredData()),
          }}
        />
      </Head>

      <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`} dir="rtl">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className={`flex-1 ${containerClassName}`}>
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* Toast Notifications */}
        <Toaster {...toasterConfig} />
      </div>
    </>
  );
};

export default PostLayout;