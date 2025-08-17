import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
// import SimpleMeta from '../../components/Meta/SimpleMeta'; // Removed - using _document.tsx for meta tags
import { Post, BreakingNews } from '../../components/API/types';
import { FiCopy, FiShare2, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Layout from '../../components/Layout/Layout';
import PostLayout from '../../components/Layout/PostLayout';
import Link from 'next/link';
import { API_BASE_URL, createTimeoutController, handleApiError, API_HEADERS } from '../../lib/api/config';
import YouTubePlayer from '../../components/Posts/YouTubePlayer';
import { formatPostContent } from '../../utils/textFormatter';
import { PostBottomAd, SidebarTopAd, SquarePostMiddleAd } from '../../components/ads';


interface SinglePostPageProps {
  post: Post | null;
  latestPosts: Post[];
  breakingNews: BreakingNews[];
  relatedPosts: Post[];
  error?: string;
}

const SinglePostPage: React.FC<SinglePostPageProps> = ({ 
  post, 
  latestPosts, 
  breakingNews, 
  relatedPosts,
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
      <PostLayout 
        title="المنشور غير موجود - مركبا" 
        description="المنشور المطلوب غير موجود أو تم حذفه"
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center py-10">
            <div className="text-red-500 mb-4">{error || 'المنشور غير موجود'}</div>
            <a href="/">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                العودة للرئيسية
              </button>
            </a>
          </div>
        </div>
      </PostLayout>
    );
  }

  const postTitle = post.title_ar || post.title || 'مركبا - أخبار لبنان';
  const pageTitle = `${postTitle} - أخبار - مـركـبـا`;
  const postDescription = post.excerpt_ar || post.excerpt || post.content_ar?.substring(0, 160) || post.content?.substring(0, 160) || 'اقرأ آخر الأخبار والمقالات على مـركـبـا';
  const postImage = post.featured_image ? `https://markaba.news${post.featured_image}` : 'https://markaba.news/images/og-image.jpg';
  const postUrl = `https://markaba.news/post/${post.slug}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={postDescription} />
        <meta name="keywords" content="أخبار, مقالات, مركبة, NewsMarkaba, لبنان" />
        <meta name="author" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={postUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={postDescription} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="ar" />
        <meta property="og:site_name" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
        <meta property="og:image" content={postImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={postTitle} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={postDescription} />
        <meta name="twitter:image" content={postImage} />
        <meta name="twitter:image:alt" content={postTitle} />
        
        {/* Article specific */}
        {post.created_at && <meta property="article:published_time" content={new Date(post.created_at).toISOString()} />}
        {post.updated_at && <meta property="article:modified_time" content={new Date(post.updated_at).toISOString()} />}
        <meta property="article:author" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
      </Head>
      <PostLayout post={post}>
        <PostContent post={post} latestPosts={latestPosts} breakingNews={breakingNews} relatedPosts={relatedPosts} />
      </PostLayout>
    </>
  );
};

const PostContent: React.FC<{ 
  post: Post; 
  latestPosts: Post[]; 
  breakingNews: BreakingNews[];
  relatedPosts: Post[];
}> = ({ post, latestPosts, breakingNews, relatedPosts }) => {
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

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'منذ لحظات';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    } else {
      return formatDate(dateString);
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
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

            {/* YouTube Video Player */}
            {post.video_link && (
              <YouTubePlayer 
                videoUrl={post.video_link} 
                title={post.title_ar || post.title}
              />
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
              dangerouslySetInnerHTML={{ 
                __html: formatPostContent(post.content_ar || post.content || '') 
              }} 
            />

            {/* Square Ad Under Post Content */}
            <SquarePostMiddleAd />

            {/* Back to Home Button */}
            <div className="flex justify-center mt-8 mb-6">
              <a href="/">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  العودة للرئيسية
                </button>
              </a>
            </div>

            {/* Related Articles Section */}
            {relatedPosts.length > 0 && (
              <div className="mt-12 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  مقالات ذات صلة
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Link key={relatedPost.id} href={`/post/${relatedPost.slug}`}>
                      <div className="group cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                        {/* Image Container */}
                        <div className="relative h-40 w-full overflow-hidden">
                          {relatedPost.featured_image ? (
                            <Image
                              src={getImageUrl(relatedPost.featured_image)}
                              alt={relatedPost.title_ar || relatedPost.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <FiFileText className="text-blue-400" size={48} />
                            </div>
                          )}
                          {/* Black fade overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          {/* Title overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-3">
                              {relatedPost.title_ar || relatedPost.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Horizontal Ad After Related Articles */}
                <PostBottomAd />
              </div>
            )}


          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Latest Posts Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                <FiFileText className="text-green-600" size={20} />
                آخر المقالات
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
                        <p className="text-xs text-green-600 font-medium">
                          {formatRelativeTime(latestPost.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Post Sidebar Ad */}
            <SidebarTopAd />

            {/* Breaking News Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-red-600 mb-4 border-b border-red-100 pb-2 flex items-center gap-2">
                <FiAlertTriangle className="text-red-600" size={20} />
                أخبار عاجلة
              </h3>
              <div className="space-y-4">
                {breakingNews.map((newsPost) => (
                  <div key={newsPost.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-red-600 mb-1">
                        {newsPost.title_ar || newsPost.title}
                      </h4>
                      <p className="text-xs text-red-600 font-medium">
                        {formatRelativeTime(newsPost.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
  );
};

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
          relatedPosts: [],
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
          relatedPosts: [],
          error: 'المنشور غير موجود'
        }
      };
    }
    
    // Fetch latest posts, breaking news, and related posts in parallel
    const [latestPostsResponse, breakingNewsResponse, relatedPostsResponse] = await Promise.all([
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
      }),
      // Fetch related posts from same category
      post.category_id ? fetch(`${baseUrl}${apiVersion}/posts?category=${post.category_id}&limit=5&sort=latest&status=published&include_content=false`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NewsMarkaba-SSR/1.0'
        }
      }) : Promise.resolve({ ok: false })
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

    // Process related posts
    let relatedPosts: Post[] = [];
    console.log('SSR: Related posts response status:', relatedPostsResponse.ok, 'Category ID:', post.category_id);
    if (relatedPostsResponse.ok && 'json' in relatedPostsResponse) {
      const relatedPostsData = await relatedPostsResponse.json();
      console.log('SSR: Related posts API response:', {
        success: relatedPostsData.success,
        totalPosts: relatedPostsData.data?.posts?.length || 0,
        posts: relatedPostsData.data?.posts?.map((p: Post) => ({ id: p.id, title: p.title_ar || p.title, categoryId: p.category_id })) || []
      });
      if (relatedPostsData.success && relatedPostsData.data?.posts) {
        // Filter out current post and limit to 4
        relatedPosts = relatedPostsData.data.posts
          .filter((p: Post) => p.id !== post.id)
          .slice(0, 4);
        console.log('SSR: Filtered related posts:', relatedPosts.map(p => ({ id: p.id, title: p.title_ar || p.title, categoryId: p.category_id })));
      }
    }

    console.log('SSR: Successfully fetched post data:', {
      postTitle: post.title_ar || post.title,
      postCategoryId: post.category_id,
      latestPostsCount: latestPosts.length,
      breakingNewsCount: breakingNews.length,
      relatedPostsCount: relatedPosts.length,
      relatedPostsCategories: relatedPosts.map(p => ({ id: p.id, title: p.title_ar || p.title, categoryId: p.category_id }))
    });
    
    return {
      props: {
        post,
        latestPosts,
        breakingNews,
        relatedPosts
      }
    };
    
  } catch (error) {
    console.error('SSR Error fetching post data:', error);
    return {
      props: {
        post: null,
        latestPosts: [],
        breakingNews: [],
        relatedPosts: [],
        error: 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.'
      }
    };
  }
};
export default SinglePostPage;
