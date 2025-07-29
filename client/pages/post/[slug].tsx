import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { useAPI, usePosts, useBreakingNews } from '../../components/API/hooks';
import { Post, BreakingNews } from '../../components/API/types';
import { FiCalendar, FiCopy, FiShare2 } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Layout from '../../components/Layout/Layout';
import Link from 'next/link';
import MetaTags from '../../components/SEO/MetaTags';

const SinglePostPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  // Handle route changes to ensure proper navigation
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Clear any cached data when starting route change
    };

    const handleRouteChange = (url: string) => {
      // Force scroll to top on route change
      window.scrollTo(0, 0);
      // Force a small delay to ensure component re-renders
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
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

  // Force complete remount when slug changes
  return <PostContent slug={slug} key={`post-content-${slug}`} />;
};

const PostContent: React.FC<{ slug: string }> = ({ slug }) => {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(20);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Transliteration function to match backend slug generation
  const transliterateAndSlugify = (text: string): string => {
    const arabicMap: { [key: string]: string } = {
      'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
      'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
      'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
      'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
      'ء': '', 'ئ': 'y', 'ؤ': 'w', 'لا': 'la'
    };
    const transliterated = text.split('').map(char => arabicMap[char] || char).join('');
    return transliterated.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Process slug for API request
  const processedSlug = transliterateAndSlugify(slug);

  // Fetch post data with proper dependency handling
  const { data: response, loading, error, refetch } = useAPI<{ posts: Post[]; total: number }>('/posts', {
    immediate: false,
    params: { slug: processedSlug, limit: 1, page: 1, _refresh: forceRefresh }
  });

  // Reset and refetch when slug changes
  useEffect(() => {
    // Always reset state and fetch when slug changes
    setLatestPosts([]);
    setBreakingNews([]);
    setFontSize(20);
    setCopySuccess(false);
    setCopyMessage('');
    setCurrentSlug(slug);
    
    // Force a complete refresh by changing the refresh key
    setForceRefresh(prev => prev + 1);
    
    const newProcessedSlug = transliterateAndSlugify(slug);
    // Force refetch with new slug
    refetch(undefined, { slug: newProcessedSlug, limit: 1, page: 1, _refresh: Date.now() });
  }, [slug, refetch]);
  
  const { data: postsResponse } = usePosts({ limit: 6 });
  const breakingNewsResponse = useBreakingNews();
  const post = response?.posts?.[0];



  // Update latest posts when data is available
  useEffect(() => {
    if (postsResponse?.posts && post) {
      const filtered = postsResponse.posts.filter((p) => p.id !== post.id);
      setLatestPosts(filtered.slice(0, 5));
    }
  }, [postsResponse, post]);

  // Update breaking news when data is available
  useEffect(() => {
    if (breakingNewsResponse?.data && Array.isArray(breakingNewsResponse.data) && post) {
      const filtered = breakingNewsResponse.data.filter((b) => b.id !== post.id);
      setBreakingNews(filtered.slice(0, 4));
    }
  }, [breakingNewsResponse, post]);

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
    // Use replace to ensure proper navigation between posts
    router.push(href).then(() => {
      // Force scroll to top after navigation
      window.scrollTo(0, 0);
    });
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
            
            {/* Category Box */}
            {post.category?.name_ar && (
              <div className="mb-4">
                <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {typeof post.category === 'string' ? post.category : post.category?.name_ar}
                </span>
              </div>
            )}
            
            {/* Summary Box */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-sm mb-8 overflow-hidden">
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
                        <div className="font-medium text-gray-800">مركبا</div>
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
              <button 
                onClick={() => handleNavigation('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للرئيسية
              </button>
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
                  <div key={latestPost.id} className="cursor-pointer" onClick={() => handleNavigation(`/post/${latestPost.slug}`)}>
                    <div className="flex gap-3 p-3 hover:bg-gray-50 transition-colors rounded-lg">
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
                  </div>
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