import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { Post, BreakingNews } from '../../components/API/types';
import { FiCopy, FiShare2, FiTag } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Layout from '../../components/Layout/Layout';
import Link from 'next/link';

// Types
interface PostPageProps {
  post: Post | null;
  relatedPosts: Post[];
  meta: MetaData;
  error?: string;
}

interface MetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  author: string;
  category: string;
  tags: string[];
  published: string;
  updated: string;
  siteName: string;
  locale: string;
}

// Meta generation function (moved outside component)
const generateMetaData = (post: Post | null, slug: string): MetaData => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news';
  const defaultImage = `${baseUrl}/images/logo_new.png`;
  
  if (!post) {
    return {
      title: 'المنشور غير موجود | أخبار مركبا',
      description: 'موقع أخبار مركبا - آخر الأخبار والمستجدات',
      image: defaultImage,
      url: `${baseUrl}/post/${slug}`,
      author: 'أخبار مركبا',
      category: 'أخبار',
      tags: [],
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      siteName: 'موقع مــركبــا الاخباري',
      locale: 'ar_AR'
    };
  }

  // Extract and clean description
  const description = (post.excerpt_ar || post.excerpt || 
    (post.content_ar || post.content)?.replace(/<[^>]*>/g, '').substring(0, 160) || 
    'موقع أخبار مركبا - آخر الأخبار والمستجدات'
  ).trim();

  // Handle tags properly
  let tags: string[] = [];
  if (post.tags) {
    if (Array.isArray(post.tags)) {
      tags = post.tags;
    } else if (typeof post.tags === 'string') {
      try {
        tags = JSON.parse(post.tags);
      } catch {
        const tagsString = post.tags as string;
        tags = tagsString.split(',').map((tag: string) => tag.trim());
      }
    }
  }

  // Handle image URL
  let imageUrl = defaultImage;
  try {
    imageUrl = (post.featured_image || post.image) ? 
      getImageUrl(post.featured_image || post.image) : defaultImage;
  } catch (e) {
    console.error('Error generating image URL:', e);
  }

  return {
    title: (post.title_ar || post.title || 'أخبار مركبا').trim(),
    description,
    image: imageUrl,
    url: `${baseUrl}/post/${post.slug}`,
    author: typeof post.author === 'string' ? post.author : 
      (post.author?.username || 'أخبار مركبا'),
    category: typeof post.category === 'string' ? post.category : 
      (post.category?.name_ar || 'أخبار'),
    tags,
    published: post.created_at || new Date().toISOString(),
    updated: post.updated_at || post.created_at || new Date().toISOString(),
    siteName: 'موقع مــركبــا الاخباري',
    locale: 'ar_AR'
  };
};

// Main Component
const SinglePostPage: React.FC<PostPageProps> = ({ 
  post, 
  relatedPosts, 
  meta,
  error 
}) => {
  const router = useRouter();

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Error state
  if (error || !post) {
    return (
      <>
        <Head>
          <title>{meta.title}</title>
          <meta name="description" content={meta.description} />
          <meta property="og:title" content={meta.title} />
          <meta property="og:description" content={meta.description} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={meta.url} />
          <meta property="og:site_name" content={meta.siteName} />
          <meta property="og:image" content={meta.image} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={meta.title} />
          <meta name="twitter:description" content={meta.description} />
          <meta name="twitter:image" content={meta.image} />
        </Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center py-10 text-gray-600">
              {error || 'المنشور غير موجود'}
            </div>
          </div>
        </Layout>
      </>
    );
  }

  // Main render with complete meta tags
  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.tags.join(', ')} />
        <meta name="author" content={meta.author} />
        <link rel="canonical" href={meta.url} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={meta.url} />
        <meta property="og:site_name" content={meta.siteName} />
        <meta property="og:locale" content={meta.locale} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:published_time" content={meta.published} />
        <meta property="article:modified_time" content={meta.updated} />
        <meta property="article:author" content={meta.author} />
        <meta property="article:section" content={meta.category} />
        {meta.tags.map((tag, index) => (
          <meta key={`og-tag-${index}`} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@markaba_news" />
        <meta name="twitter:creator" content="@markaba_news" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        
        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Arabic" />
        <meta httpEquiv="Content-Language" content="ar" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": meta.title,
              "description": meta.description,
              "image": meta.image,
              "datePublished": meta.published,
              "dateModified": meta.updated,
              "author": {
                "@type": "Person",
                "name": meta.author
              },
              "publisher": {
                "@type": "Organization",
                "name": meta.siteName,
                "logo": {
                  "@type": "ImageObject",
                  "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/logo_new.png`
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": meta.url
              },
              "articleSection": meta.category,
              "keywords": meta.tags || [],
              "inLanguage": "ar"
            })
          }}
        />
      </Head>
      
      <Layout>
        <PostContent post={post} relatedPosts={relatedPosts} />
      </Layout>
    </>
  );
};

// Post Content Component
const PostContent: React.FC<{ post: Post; relatedPosts: Post[] }> = ({ post, relatedPosts }) => {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title_ar || post.title,
          text: post.excerpt_ar || post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Handle tags properly for display
  let tags: string[] = [];
  if (post?.tags) {
    if (Array.isArray(post.tags)) {
      tags = post.tags;
    } else if (typeof post.tags === 'string') {
      try {
        tags = JSON.parse(post.tags);
      } catch {
        const tagsString = post.tags as string;
        tags = tagsString.split(',').map((tag: string) => tag.trim());
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Post Header */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Featured Image */}
          {(post.featured_image || post.image) && (
            <div className="relative w-full h-64 md:h-96">
              <Image
                src={getImageUrl(post.featured_image || post.image)}
                alt={post.title_ar || post.title || 'صورة المقال'}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Category */}
            {post.category && (
              <div className="mb-4">
                <Link 
                  href={`/category/${typeof post.category === 'string' ? post.category : post.category.slug}`}
                  className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {typeof post.category === 'string' ? post.category : (post.category.name_ar)}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title_ar || post.title}
            </h1>

            {/* Excerpt */}
            {(post.excerpt_ar || post.excerpt) && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {post.excerpt_ar || post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
              {/* Author */}
              <div className="flex items-center gap-2">
                <span>بواسطة:</span>
                <span className="font-medium text-gray-700">
                  {typeof post.author === 'string' ? post.author : (post.author?.username || 'أخبار مركبا')}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2">
                <span>تاريخ النشر:</span>
                <time className="font-medium text-gray-700">
                  {formatDate(post.created_at)}
                </time>
              </div>

              {/* Updated Date */}
              {post.updated_at && post.updated_at !== post.created_at && (
                <div className="flex items-center gap-2">
                  <span>آخر تحديث:</span>
                  <time className="font-medium text-gray-700">
                    {formatDate(post.updated_at)}
                  </time>
                </div>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <FiTag className="text-gray-400" />
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
              <span className="text-gray-600 font-medium">مشاركة:</span>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiShare2 size={16} />
                <span>مشاركة</span>
              </button>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiCopy size={16} />
                <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            </div>

            {/* Post Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:hover:text-blue-800 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: post.content_ar || post.content || '' 
              }}
            />
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">مقالات ذات صلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/post/${relatedPost.slug}`}
                  className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Related Post Image */}
                  {(relatedPost.featured_image || relatedPost.image) && (
                    <div className="relative w-full h-48">
                      <Image
                        src={getImageUrl(relatedPost.featured_image || relatedPost.image)}
                        alt={relatedPost.title_ar || relatedPost.title || 'صورة المقال'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    {/* Related Post Category */}
                    {relatedPost.category && (
                      <div className="mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {typeof relatedPost.category === 'string' 
                            ? relatedPost.category 
                            : (relatedPost.category.name_ar || relatedPost.category.name_ar)
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* Related Post Title */}
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {relatedPost.title_ar || relatedPost.title}
                    </h3>
                    
                    {/* Related Post Excerpt */}
                    {(relatedPost.excerpt_ar || relatedPost.excerpt) && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {relatedPost.excerpt_ar || relatedPost.excerpt}
                      </p>
                    )}
                    
                    {/* Related Post Date */}
                    <div className="mt-3 text-xs text-gray-500">
                      {formatDate(relatedPost.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

// Server-side rendering function
export const getServerSideProps: GetServerSideProps<PostPageProps> = async (context) => {
  const { slug } = context.params as { slug: string };
  
  if (!slug) {
    const meta = generateMetaData(null, '');
    return {
      props: {
        post: null,
        relatedPosts: [],
        meta,
        error: 'الرابط غير صحيح'
      }
    };
  }

  try {
    // API configuration
    const isDevelopment = process.env.NODE_ENV === 'development';
    const API_URL = isDevelopment ? 'http://localhost:5000/api' : 'https://api.markaba.news/api/v2';
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'NewsMarkaba-SSR/1.0',
    };

    // Get post by slug
    const postsResponse = await fetch(
      `${API_URL}/posts?slug=${encodeURIComponent(slug)}&limit=1&page=1`, 
      { headers }
    );

    if (!postsResponse.ok) {
      const meta = generateMetaData(null, slug);
      return {
        props: {
          post: null,
          relatedPosts: [],
          meta,
          error: 'المنشور غير موجود'
        }
      };
    }

    const postsData = await postsResponse.json();
    
    if (!postsData.success || !postsData.data?.posts?.length) {
      const meta = generateMetaData(null, slug);
      return {
        props: {
          post: null,
          relatedPosts: [],
          meta,
          error: 'المنشور غير موجود'
        }
      };
    }

    const post = postsData.data.posts[0];
    
    // Fetch full post with related content
    let fullPost = post;
    let relatedPosts: Post[] = [];
    
    try {
      const fullPostResponse = await fetch(
        `${API_URL}/posts/${post.id}/${slug}?include_related=true&track_view=false`, 
        { headers }
      );

      if (fullPostResponse.ok) {
        const fullPostData = await fullPostResponse.json();
        if (fullPostData.success && fullPostData.data) {
          fullPost = fullPostData.data.post || post;
          relatedPosts = fullPostData.data.related_posts || [];
        }
      }
    } catch (e) {
      console.error('Error fetching full post:', e);
    }

    // Parse tags
    if (fullPost.tags && typeof fullPost.tags === 'string') {
      try {
        fullPost.tags = JSON.parse(fullPost.tags);
      } catch {
        fullPost.tags = fullPost.tags.split(',').map((t: string) => t.trim());
      }
    }
    
    // Generate meta data on server
    const meta = generateMetaData(fullPost, slug);

    return {
      props: {
        post: fullPost,
        relatedPosts,
        meta
      }
    };
  } catch (error) {
    const meta = generateMetaData(null, slug);
    return {
      props: {
        post: null,
        relatedPosts: [],
        meta,
        error: 'حدث خطأ أثناء تحميل المنشور'
      }
    };
  }
};

export default SinglePostPage;