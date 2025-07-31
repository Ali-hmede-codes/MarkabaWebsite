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
  meta?: MetaData;
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

// Main Component
const SinglePostPage: React.FC<PostPageProps> = ({ post, relatedPosts, meta, error }) => {
  const router = useRouter();

  // Use server-side generated meta data or fallback
  const defaultMeta: MetaData = {
    title: 'المنشور غير موجود | أخبار مركبا',
    description: 'موقع أخبار مركبا - آخر الأخبار والمستجدات',
    image: 'https://markaba.news/images/logo_new.png',
    url: 'https://markaba.news',
    author: 'أخبار مركبا',
    category: 'أخبار',
    tags: [],
    published: new Date().toISOString(),
    updated: new Date().toISOString(),
    siteName: 'موقع مــركبــا الاخباري',
    locale: 'ar_AR'
  };

  const finalMeta = meta || defaultMeta;

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

  // Loading state during client-side navigation
  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>جاري التحميل... | أخبار مركبا</title>
          <meta name="description" content="جاري تحميل المحتوى..." />
        </Head>
        <Layout title="جاري التحميل..." description="">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center py-10 text-gray-600">جاري التحميل...</div>
          </div>
        </Layout>
      </>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <>
        <Head>
          <title>{finalMeta.title}</title>
          <meta name="description" content={finalMeta.description} />
          <meta property="og:title" content={finalMeta.title} />
          <meta property="og:description" content={finalMeta.description} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={finalMeta.url} />
          <meta property="og:site_name" content={finalMeta.siteName} />
          <meta property="og:image" content={finalMeta.image} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={finalMeta.title} />
          <meta name="twitter:description" content={finalMeta.description} />
          <meta name="twitter:image" content={finalMeta.image} />
        </Head>
        <Layout title="المنشور غير موجود" description="">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center py-10 text-gray-600">
              {error || 'المنشور غير موجود'}
            </div>
          </div>
        </Layout>
      </>
    );
  }

  // Main render with complete meta tags <mcreference link="https://developer.x.com/en/docs/x-for-websites/cards/guides/getting-started" index="4">4</mcreference>
  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{finalMeta.title}</title>
        <meta name="description" content={finalMeta.description} />
        <meta name="keywords" content={finalMeta.tags.join(', ')} />
        <meta name="author" content={finalMeta.author} />
        <link rel="canonical" href={finalMeta.url} />
        
        {/* Open Graph Meta Tags <mcreference link="https://www.davegray.codes/posts/nextjs-open-graph-social-media-cards" index="3">3</mcreference> */}
        <meta property="og:title" content={finalMeta.title} />
        <meta property="og:description" content={finalMeta.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={finalMeta.url} />
        <meta property="og:site_name" content={finalMeta.siteName} />
        <meta property="og:locale" content={finalMeta.locale} />
        <meta property="og:image" content={finalMeta.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:published_time" content={finalMeta.published} />
        <meta property="article:modified_time" content={finalMeta.updated} />
        <meta property="article:author" content={finalMeta.author} />
        <meta property="article:section" content={finalMeta.category} />
        {finalMeta.tags.map((tag, index) => (
          <meta key={`og-tag-${index}`} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card Meta Tags <mcreference link="https://developer.x.com/en/docs/x-for-websites/cards/guides/getting-started" index="4">4</mcreference> */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@markaba_news" />
        <meta name="twitter:creator" content="@markaba_news" />
        <meta name="twitter:title" content={finalMeta.title} />
        <meta name="twitter:description" content={finalMeta.description} />
        <meta name="twitter:image" content={finalMeta.image} />
        
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
              "@type": "NewsArticle",
              "headline": finalMeta.title,
              "description": finalMeta.description,
              "image": [finalMeta.image],
              "datePublished": finalMeta.published,
              "dateModified": finalMeta.updated,
              "author": {
                "@type": "Person",
                "name": finalMeta.author
              },
              "publisher": {
                "@type": "Organization",
                "name": finalMeta.siteName,
                "logo": {
                  "@type": "ImageObject",
                  "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/logo_new.png`
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": finalMeta.url
              },
              "articleSection": finalMeta.category,
              "keywords": finalMeta.tags.join(', '),
              "inLanguage": "ar"
            })
          }}
        />
      </Head>
      
      <PostContent post={post} relatedPosts={relatedPosts} />
    </>
  );
};

// Post Content Component
const PostContent: React.FC<{ post: Post; relatedPosts: Post[] }> = ({ post, relatedPosts }) => {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(20);
  const [latestPosts, setLatestPosts] = useState<Post[]>(relatedPosts || []);
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  // Update related posts when prop changes
  useEffect(() => {
    setLatestPosts(relatedPosts || []);
  }, [relatedPosts]);

  // Fetch breaking news
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const response = await fetch('/api/breaking-news?active=true&limit=5');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setBreakingNews(data.data);
          }
        }
      } catch (err) {
          // Silently handle breaking news fetch errors
        }
    };

    fetchBreakingNews();
  }, []);

  // Utility functions
  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setCopyMessage('تم النسخ');
      setTimeout(() => {
        setCopySuccess(false);
        setCopyMessage('');
      }, 2000);
    } catch (err) {
      // Silently handle copy errors
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title_ar || post?.title || '',
          url: window.location.href
        });
      } catch (err) {
        // Silently handle sharing errors
      }
    } else {
      handleCopyText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };



  // Post not found
  if (!post) {
    return (
      <Layout title="المنشور غير موجود" description="">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center py-10">
            <div className="text-red-500 mb-4">المنشور غير موجود</div>
            <button 
              onClick={() => handleNavigation('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Post Title */}
            <h1 className="text-3xl font-bold mb-6 text-gray-900 leading-tight">
              {post.title_ar || post.title}
            </h1>
            
            {/* Summary Box Container with Category Badge */}
            <div className="relative mb-8">
              {/* Category Badge */}
              {post.category?.name_ar && (
                <div className="absolute top-0 z-10" style={{top: '-25px'}}>
                  <span className="inline-block bg-blue-500 text-white px-3 py-1 text-xs font-medium shadow-sm" style={{borderTopLeftRadius: '0', borderTopRightRadius: '8px', borderBottomLeftRadius: '0', borderBottomRightRadius: '0'}}>
                    {typeof post.category === 'string' ? post.category : post.category?.name_ar}
                  </span>
                </div>
              )}
              
              {/* Summary Box */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  {/* Post Summary/Excerpt */}
                  {(post.excerpt_ar || post.excerpt) && (
                    <div className="mb-4">
                      <p className="text-gray-700 text-base leading-relaxed">
                        {post.excerpt_ar || post.excerpt}
                      </p>
                    </div>
                  )}
                  
                  {/* Social sharing and info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-white-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          <Image 
                            src="/images/logo.png" 
                            alt="مركبا" 
                            width={40} 
                            height={40} 
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">مـركـبـا - الـمـنـصـة الاخـبـاريـة</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse relative">
                      {copyMessage && (
                        <div className="absolute -top-8 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          {copyMessage}
                        </div>
                      )}
                      <button 
                        onClick={() => handleCopyText(post.excerpt_ar || post.excerpt || '')}
                        className={`p-2 transition-colors ${
                          copySuccess 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-black hover:text-gray-800'
                        }`}
                        title="نسخ النص"
                      >
                        <FiCopy size={16} />
                      </button>
                      <button 
                        onClick={handleShare}
                        className="p-2 text-black hover:text-gray-800 transition-colors"
                        title="مشاركة"
                      >
                        <FiShare2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {(post.featured_image || post.image) && (
              <div className="relative w-full aspect-video md:h-96 md:aspect-auto mb-8">
                <Image 
                  src={getImageUrl(post.featured_image || post.image || '')} 
                  alt={post.title_ar || post.title} 
                  fill 
                  className="object-cover rounded-lg shadow-lg" 
                />
              </div>
            )}

            {/* Font Size Controller */}
            <div className="flex items-center justify-center mb-6 bg-gray-50 rounded-lg p-4">
              <button 
                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                title="تصغير الخط"
              >
                -
              </button>
              <span className="mx-4 text-gray-700 font-medium">الخط</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(20, prev + 2))}
                className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                title="تكبير الخط"
              >
                +
              </button>
            </div>

            {/* Post Content */}
            <div 
              className="prose max-w-none mb-8 text-gray-800 leading-relaxed" 
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: post.content_ar || post.content }} 
            />

            {/* Tags Section */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <FiTag className="text-blue-500 ml-2" size={18} />
                  <h3 className="text-lg font-semibold text-gray-800">الكلمات المفتاحية</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(post.tags) ? post.tags : []).map((tag, index) => (
                    <Link 
                      key={index} 
                      href={`/posts?tags=${encodeURIComponent(tag)}`}
                      className="inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Posts Section */}
            {latestPosts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-2">
                  مقالات ذات صلة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {latestPosts.slice(0, 4).map((relatedPost) => (
                    <Link 
                      key={relatedPost.id} 
                      href={`/post/${relatedPost.slug}`}
                      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                    >
                      {(relatedPost.featured_image || relatedPost.image) && (
                        <div className="relative w-full h-32">
                          <Image 
                            src={getImageUrl(relatedPost.featured_image || relatedPost.image || '')} 
                            alt={relatedPost.title_ar || relatedPost.title} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">
                          {relatedPost.title_ar || relatedPost.title}
                        </h4>
                        {(relatedPost.excerpt_ar || relatedPost.excerpt) && (
                          <p className="text-gray-600 text-xs line-clamp-2">
                            {relatedPost.excerpt_ar || relatedPost.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>{formatDate(relatedPost.created_at)}</span>
                          <span>{relatedPost.views} مشاهدة</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Home Button */}
            <div className="flex justify-center mt-8 mb-6">
              <Link href="/">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  العودة للرئيسية
                </button>
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Latest Posts Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                آخر الأخبار
              </h3>
              <div className="space-y-4">
                {latestPosts.map((latestPost) => (
                  <Link key={latestPost.id} href={`/post/${latestPost.slug}`}>
                    <div className="flex gap-3 p-3 hover:bg-gray-50 transition-colors rounded-lg cursor-pointer">
                      {(latestPost.featured_image || latestPost.image) && (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image 
                            src={getImageUrl(latestPost.featured_image || latestPost.image || '')} 
                            alt={latestPost.title_ar || latestPost.title} 
                            fill 
                            className="object-cover rounded-md" 
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {latestPost.title_ar || latestPost.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatDate(latestPost.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Breaking News Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                أخبار عاجلة
              </h3>
              <div className="space-y-4">
                {breakingNews.map((newsPost) => (
                  <div key={newsPost.id} className="flex gap-3 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {newsPost.title_ar || newsPost.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatDate(newsPost.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

// Server-side rendering function <mcreference link="https://blog.logrocket.com/implementing-ssr-next-js-dynamic-routing-prefetching/" index="1">1</mcreference>
export const getServerSideProps: GetServerSideProps<PostPageProps> = async (context) => {
  const { slug } = context.params as { slug: string };
  
  if (!slug) {
    return {
      notFound: true,
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

    // First, get the post by slug to find its ID
    const postsResponse = await fetch(
      `${API_URL}/posts?slug=${encodeURIComponent(slug)}&limit=1&page=1`, 
      {
        method: 'GET',
        headers,
      }
    );

    if (!postsResponse.ok) {
      console.error('Failed to fetch post by slug:', postsResponse.status, postsResponse.statusText);
      return {
        notFound: true,
      };
    }

    const postsData = await postsResponse.json();
    
    if (!postsData.success || !postsData.data?.posts || postsData.data.posts.length === 0) {
      return {
        notFound: true,
      };
    }

    const post = postsData.data.posts[0];
    
    // Fetch the full post with related posts using the ID and slug
    const fullPostResponse = await fetch(
      `${API_URL}/posts/${post.id}/${slug}?include_related=true&track_view=false`, 
      {
        method: 'GET',
        headers,
      }
    );

    if (!fullPostResponse.ok) {
      console.error('Failed to fetch full post:', fullPostResponse.status, fullPostResponse.statusText);
      return {
        props: {
          post,
          relatedPosts: [],
        },
      };
    }

    const fullPostData = await fullPostResponse.json();
    
    if (!fullPostData.success || !fullPostData.data) {
      return {
        props: {
          post,
          relatedPosts: [],
        },
      };
    }

    const fullPost = fullPostData.data.post || post;
    const relatedPosts = fullPostData.data.related_posts || [];

    // Ensure tags are properly parsed
    if (fullPost.tags && typeof fullPost.tags === 'string') {
      try {
        fullPost.tags = JSON.parse(fullPost.tags);
      } catch (e) {
        fullPost.tags = [];
      }
    }

    // Ensure tags is always an array
    if (!Array.isArray(fullPost.tags)) {
      fullPost.tags = [];
    }

    // Generate meta data for SSR
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news';
    const defaultImage = `${baseUrl}/images/logo_new.png`;
    
    const metaTitle = (fullPost.title_ar || fullPost.title || 'أخبار مركبا').trim();
    const metaDescription = (fullPost.excerpt_ar || fullPost.excerpt || 
      (fullPost.content_ar || fullPost.content)?.replace(/<[^>]*>/g, '').substring(0, 160) || 
      'موقع أخبار مركبا - آخر الأخبار والمستجدات'
    ).trim();
    const metaImage = (fullPost.featured_image || fullPost.image) ? 
      `${baseUrl}/uploads/${fullPost.featured_image || fullPost.image}` : defaultImage;
    const metaUrl = `${baseUrl}/post/${fullPost.slug}`;

    return {
      props: {
        post: fullPost,
        relatedPosts,
        meta: {
          title: metaTitle,
          description: metaDescription,
          image: metaImage,
          url: metaUrl,
          author: typeof fullPost.author === 'string' ? fullPost.author : 
            (fullPost.author?.username || 'أخبار مركبا'),
          category: typeof fullPost.category === 'string' ? fullPost.category : 
            (fullPost.category?.name_ar || 'أخبار'),
          tags: fullPost.tags || [],
          published: fullPost.created_at || new Date().toISOString(),
          updated: fullPost.updated_at || fullPost.created_at || new Date().toISOString(),
          siteName: 'موقع مــركبــا الاخباري',
          locale: 'ar_AR'
        }
      },
    };
  } catch (error) {
      return {
        props: {
          post: null,
          relatedPosts: [],
          error: 'خطأ في تحميل المنشور',
        },
      };
    }
};

export default SinglePostPage;