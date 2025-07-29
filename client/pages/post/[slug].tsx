import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { Post, BreakingNews } from '../../components/API/types';
import { FiCopy, FiShare2 } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Layout from '../../components/Layout/Layout';
import Link from 'next/link';
import MetaTags from '../../components/SEO/MetaTags';
import { API_BASE_URL, createTimeoutController, handleApiError, API_HEADERS } from '../../lib/api/config';

const SinglePostPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

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

  // Don't render anything until router is ready and slug is available
  if (!router.isReady || !slug) {
    return (
      <Layout title="جاري التحميل..." description="">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center py-10 text-gray-600">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  return <PostContent slug={slug} key={`post-content-${slug}`} />;
};

const PostContent: React.FC<{ slug: string }> = ({ slug }) => {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(20);
  const [post, setPost] = useState<Post | null>(null);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset state when slug changes
  useEffect(() => {
    setPost(null);
    setLatestPosts([]);
    setBreakingNews([]);
    setFontSize(20);
    setCopySuccess(false);
    setCopyMessage('');
    setError(null);
    // Force scroll to top when slug changes
    window.scrollTo(0, 0);
  }, [slug]);

  // Fetch single post by slug
  useEffect(() => {
    const fetchPost = async () => {
      const { controller, timeoutId, cleanup } = createTimeoutController();
      try {
        setLoading(true);
        const response = await fetch(`/api/posts?slug=${slug}&limit=1&page=1`, {
          method: 'GET',
          headers: API_HEADERS,
          signal: controller.signal
        });
        
        cleanup();
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.posts && data.data.posts.length > 0) {
          setPost(data.data.posts[0]);
        } else {
          setError('المنشور غير موجود');
        }
      } catch (err) {
        cleanup();
        const apiError = handleApiError(err, '/api/posts');
        console.error('Error fetching post:', err);
        setError(apiError.message || 'خطأ في تحميل المنشور');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // Fetch latest posts for sidebar
  useEffect(() => {
    const fetchLatestPosts = async () => {
      const { controller, timeoutId, cleanup } = createTimeoutController();
      try {
        const response = await fetch('/api/posts?active=true&limit=6&include_content=false', {
          method: 'GET',
          headers: API_HEADERS,
          signal: controller.signal
        });
        
        cleanup();
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.posts) {
          // Filter out current post
          const filtered = data.data.posts.filter((p: Post) => p.id !== post?.id);
          setLatestPosts(filtered.slice(0, 5));
        }
      } catch (err) {
        cleanup();
        const apiError = handleApiError(err, '/api/posts');
        console.error('Error fetching latest posts:', apiError.message);
      }
    };

    if (post) {
      fetchLatestPosts();
    }
  }, [post]);

  // Fetch breaking news for sidebar
  useEffect(() => {
    const fetchBreakingNews = async () => {
      const { controller, timeoutId, cleanup } = createTimeoutController();
      try {
        const response = await fetch('/api/breaking-news?active=true&limit=4&include_content=false', {
          method: 'GET',
          headers: API_HEADERS,
          signal: controller.signal
        });
        
        cleanup();
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Filter out current post if it exists in breaking news
          const filtered = data.data.filter((item: BreakingNews) => item.id !== post?.id);
          setBreakingNews(filtered.slice(0, 4));
        }
      } catch (err) {
        cleanup();
        const apiError = handleApiError(err, '/api/breaking-news');
        console.error('Error fetching breaking news:', apiError.message);
      }
    };

    fetchBreakingNews();
  }, [post]);

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

  if (loading) {
    return (
      <Layout title="جاري التحميل..." description="">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center py-10 text-gray-600">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
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
    <Layout title={post.title_ar || post.title} description={post.excerpt_ar || post.excerpt}>
      <MetaTags
        pageType="post"
        pageData={{ post }}
        customMeta={{
          title: post.title_ar || post.title,
          description: post.excerpt_ar || post.excerpt || (post.content_ar || post.content)?.substring(0, 160),
          image: post.featured_image ? getImageUrl(post.featured_image) : undefined,
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://markaba.news'}/post/${post.slug}`,
          type: 'article',
          publishedTime: post.created_at,
          modifiedTime: post.updated_at,
          author: typeof post.author === 'string' ? post.author : post.author?.username || 'Markaba News',
          section: typeof post.category === 'string' ? post.category : post.category?.name_ar || 'أخبار',
          tags: post.tags || undefined
        }}
        language="ar"
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Post Title */}
            <h1 className="text-3xl font-bold mb-6 text-gray-900 leading-tight">
              {post.title_ar || post.title}
            </h1>
            
            {/* Summary Box */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-sm mb-8 overflow-hidden relative">
              {/* Category Badge - Outer Left Top */}
              {post.category?.name_ar && (
                <div className="absolute -top-0 -left-0 z-10">
                  <span className="inline-block bg-blue-500 text-white px-3 py-1 text-xs font-medium shadow-sm" style={{borderTopLeftRadius: '8px', borderTopRightRadius: '0', borderBottomLeftRadius: '0', borderBottomRightRadius: '0'}}>
                    {typeof post.category === 'string' ? post.category : post.category?.name_ar}
                  </span>
                </div>
              )}
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