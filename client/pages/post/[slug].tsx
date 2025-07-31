import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps, Metadata } from 'next';
import { Post, BreakingNews } from '../../components/API/types';
import { FiCopy, FiShare2 } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Layout from '../../components/Layout/Layout';
import Link from 'next/link';
import { API_BASE_URL, createTimeoutController, handleApiError, API_HEADERS } from '../../lib/api/config';

// Server-side rendering function
export const getServerSideProps: GetServerSideProps<SinglePostPageProps> = async (context) => {
  const { slug } = context.params as { slug: string };
  
  try {
    // Use production API URL
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment ? 'http://localhost:5000' : 'https://api.markaba.news';
    const apiVersion = isDevelopment ? '/api' : '/api/v2';
    
    console.log('SSR: Fetching post data for slug:', slug);
    
    // Fetch post data
    const postResponse = await fetch(`${baseUrl}${apiVersion}/posts?slug=${slug}&limit=1&page=1`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NewsMarkaba-SSR/1.0'
      }
    });
    
    if (!postResponse.ok) {
      console.error('SSR: Post response not ok:', postResponse.status);
      return {
        props: {
          post: null,
          latestPosts: [],
          breakingNews: [],
          error: 'المنشور غير موجود'
        }
      };
    }
    
    const postData = await postResponse.json();
    const post = postData.success && postData.data?.posts?.length > 0 ? postData.data.posts[0] : null;
    
    if (!post) {
      return {
        props: {
          post: null,
          latestPosts: [],
          breakingNews: [],
          error: 'المنشور غير موجود'
        }
      };
    }
    
    // Fetch latest posts and breaking news in parallel
    const [latestPostsResponse, breakingNewsResponse] = await Promise.all([
      fetch(`${baseUrl}${apiVersion}/posts?limit=6&sort=latest&active=true&include_content=false`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsMarkaba-SSR/1.0'
        }
      }),
      fetch(`${baseUrl}${apiVersion}/breaking-news?limit=4&active=true&include_content=false`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsMarkaba-SSR/1.0'
        }
      })
    ]);
    
    // Process latest posts
    let latestPosts: Post[] = [];
    if (latestPostsResponse.ok) {
      const latestPostsData = await latestPostsResponse.json();
      if (latestPostsData.success && latestPostsData.data?.posts) {
        // Filter out current post
        latestPosts = latestPostsData.data.posts
          .filter((p: Post) => p.id !== post.id)
          .slice(0, 5);
      }
    }
    
    // Process breaking news
    let breakingNews: BreakingNews[] = [];
    if (breakingNewsResponse.ok) {
      const breakingNewsData = await breakingNewsResponse.json();
      if (breakingNewsData.success && breakingNewsData.data) {
        // Filter out current post if it exists in breaking news
        breakingNews = breakingNewsData.data
          .filter((item: BreakingNews) => item.id !== post.id)
          .slice(0, 4);
      }
    }
    
    console.log('SSR: Successfully fetched post data:', {
      postTitle: post.title_ar || post.title,
      latestPostsCount: latestPosts.length,
      breakingNewsCount: breakingNews.length
    });
    
    return {
      props: {
        post,
        latestPosts,
        breakingNews
      }
    };
    
  } catch (error) {
    console.error('SSR Error fetching post data:', error);
    return {
      props: {
        post: null,
        latestPosts: [],
        breakingNews: [],
        error: 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.'
      }
    };
  }
};


interface SinglePostPageProps {
  post: Post | null;
  latestPosts: Post[];
  breakingNews: BreakingNews[];
  error?: string;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const { slug } = params;
    const { controller, cleanup } = createTimeoutController(10000);
    
    const response = await fetch(`${API_BASE_URL}/posts/slug/${encodeURIComponent(slug)}`, {
      headers: API_HEADERS,
      signal: controller.signal,
    });
    
    cleanup();

    if (!response.ok) {
      return {
        title: 'المنشور غير موجود - مركبا',
        description: 'المنشور المطلوب غير موجود أو تم حذفه',
        robots: 'noindex, nofollow'
      };
    }

    const data = await response.json();
    const post = data.post;

    if (!post) {
      return {
        title: 'المنشور غير موجود - مركبا',
        description: 'المنشور المطلوب غير موجود أو تم حذفه',
        robots: 'noindex, nofollow'
      };
    }

    const postTitle = post.title_ar || post.title;
    const postDescription = post.excerpt_ar || post.excerpt || (post.content_ar || post.content)?.replace(/<[^>]*>/g, '').substring(0, 160);
    const postImage = post.featured_image || post.image;
    const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/post/${post.slug}`;
    const authorName = typeof post.author === 'string' ? post.author : post.author?.username || 'Markaba News';
    const categoryName = typeof post.category === 'string' ? post.category : post.category?.name_ar || 'أخبار';
    const keywords = post.meta_keywords_ar ? post.meta_keywords_ar.split(',').map((k: string) => k.trim()).join(', ') : `${postTitle}, ${categoryName}, مركبا, أخبار`;

    return {
      title: `${postTitle} - مركبا`,
      description: postDescription,
      keywords: keywords,
      authors: [{ name: authorName }],
      robots: 'index, follow',
      alternates: {
        canonical: postUrl
      },
      openGraph: {
        type: 'article',
        title: postTitle,
        description: postDescription,
        url: postUrl,
        siteName: 'مركبا - المنصة الإخبارية',
        locale: 'ar_AR',
        images: postImage ? [{
          url: getImageUrl(postImage),
          width: 1200,
          height: 630,
          alt: postTitle
        }] : [],
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        authors: [authorName],
        section: categoryName,
        tags: post.meta_keywords_ar ? post.meta_keywords_ar.split(',').map((k: string) => k.trim()) : []
      },
      twitter: {
        card: 'summary_large_image',
        title: postTitle,
        description: postDescription,
        site: '@markaba_news',
        creator: '@markaba_news',
        images: postImage ? [getImageUrl(postImage)] : []
      },
      other: {
        'article:author': authorName,
        'article:section': categoryName,
        'article:published_time': post.created_at,
        'article:modified_time': post.updated_at
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'خطأ في تحميل المنشور - مركبا',
      description: 'حدث خطأ أثناء تحميل المنشور',
      robots: 'noindex, nofollow'
    };
  }
}

const SinglePostPage: React.FC<SinglePostPageProps> = ({ 
  post, 
  latestPosts, 
  breakingNews, 
  error 
}) => {
  const router = useRouter();

  // Handle route changes to ensure proper navigation
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Force scroll to top on route change
      window.scrollTo(0, 0);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  if (error || !post) {
    return (
      <>
        <Head>
          <title>المنشور غير موجود - مركبا</title>
          <meta name="description" content="المنشور المطلوب غير موجود أو تم حذفه" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Layout title="المنشور غير موجود" description="">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center py-10">
              <div className="text-red-500 mb-4">{error || 'المنشور غير موجود'}</div>
              <Link href="/">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  العودة للرئيسية
                </button>
              </Link>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  // Generate metadata for the post
  const postTitle = post.title_ar || post.title;
  const postDescription = post.excerpt_ar || post.excerpt || (post.content_ar || post.content)?.replace(/<[^>]*>/g, '').substring(0, 160);
  const postImage = post.featured_image || post.image;
  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/post/${post.slug}`;
  const authorName = typeof post.author === 'string' ? post.author : post.author?.username || 'Markaba News';
  const categoryName = typeof post.category === 'string' ? post.category : post.category?.name_ar || 'أخبار';
  const keywords = post.meta_keywords_ar ? post.meta_keywords_ar.split(',').map(k => k.trim()).join(', ') : `${postTitle}, ${categoryName}, مركبا, أخبار`;

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{postTitle} - مركبا</title>
        <meta name="description" content={postDescription} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={authorName} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={postUrl} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={postTitle} />
        <meta property="og:description" content={postDescription} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:site_name" content="مركبا - المنصة الإخبارية" />
        <meta property="og:locale" content="ar_AR" />
        {postImage && (
          <>
            <meta property="og:image" content={getImageUrl(postImage)} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={postTitle} />
          </>
        )}
        
        {/* Article Specific Meta Tags */}
        <meta property="article:published_time" content={post.created_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:author" content={authorName} />
        <meta property="article:section" content={categoryName} />
        {post.meta_keywords_ar && post.meta_keywords_ar.split(',').map((tag, index) => (
          <meta key={index} property="article:tag" content={tag.trim()} />
        ))}
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postTitle} />
        <meta name="twitter:description" content={postDescription} />
        <meta name="twitter:site" content="@markaba_news" />
        <meta name="twitter:creator" content="@markaba_news" />
        {postImage && (
          <meta name="twitter:image" content={getImageUrl(postImage)} />
        )}
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": postTitle,
              "description": postDescription,
              "image": postImage ? [getImageUrl(postImage)] : undefined,
              "datePublished": post.created_at,
              "dateModified": post.updated_at,
              "author": {
                "@type": "Person",
                "name": authorName
              },
              "publisher": {
                "@type": "Organization",
                "name": "مركبا - المنصة الإخبارية",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/images/logo.png`
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": postUrl
              },
              "articleSection": categoryName,
              "keywords": keywords
            })
          }}
        />
      </Head>
      <PostContent post={post} latestPosts={latestPosts} breakingNews={breakingNews} />
    </>
  );
};

const PostContent: React.FC<{ 
  post: Post; 
  latestPosts: Post[]; 
  breakingNews: BreakingNews[]; 
}> = ({ post, latestPosts, breakingNews }) => {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(20);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  // Reset state when component mounts
  useEffect(() => {
    setFontSize(20);
    setCopySuccess(false);
    setCopyMessage('');
    // Force scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [post.slug]);

  // No client-side data fetching needed - data comes from SSR

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
      console.error('Failed to copy text:', err);
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
        console.error('Error sharing:', err);
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
              {/* Category Badge - Outside Right Top */}
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
export default SinglePostPage;
