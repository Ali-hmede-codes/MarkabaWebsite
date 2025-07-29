import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { Post, BreakingNews } from '../../components/API/types';
import {  FiCopy, FiShare2 } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Layout from '../../components/Layout/Layout';
import Link from 'next/link';
import MetaTags from '../../components/SEO/MetaTags';

const SinglePostPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug) return <div className="text-center py-10">جاري التحميل...</div>;

  return router.isReady ? <InnerPost slug={slug} key={`post-${slug}`} /> : <div className="text-center py-10">جاري التحميل...</div>;
};

const InnerPost: React.FC<{ slug: string }> = ({ slug }) => {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(20);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  // Reset state when slug changes
   useEffect(() => {
     setPost(null);
     setLatestPosts([]);
     setBreakingNews([]);
     setFontSize(20);
     setError(null);
   }, [slug]);

   // Fetch post data
   useEffect(() => {
     if (!slug) return;

     const fetchData = async () => {
       try {
         setLoading(true);
         
         // Fetch main post
         const postResponse = await fetch(`/api/posts?slug=${slug}&limit=1&page=1`);
         if (!postResponse.ok) {
           throw new Error('Failed to fetch post');
         }
         const postData = await postResponse.json();
         
         if (!postData.posts || postData.posts.length === 0) {
           throw new Error('Post not found');
         }
         
         const currentPost = postData.posts[0];
         setPost(currentPost);
         
         // Fetch latest posts
         const latestResponse = await fetch('/api/posts?limit=6&page=1');
         if (latestResponse.ok) {
           const latestData = await latestResponse.json();
           if (latestData.posts) {
             const filtered = latestData.posts.filter((p: Post) => p.id !== currentPost.id);
             setLatestPosts(filtered.slice(0, 5));
           }
         }
         
         // Fetch breaking news
         const breakingResponse = await fetch('/api/breaking-news');
         if (breakingResponse.ok) {
           const breakingData = await breakingResponse.json();
           if (Array.isArray(breakingData)) {
             const filtered = breakingData.filter((b: BreakingNews) => b.id !== currentPost.id);
             setBreakingNews(filtered.slice(0, 4));
           }
         }
         
       } catch (err) {
         console.error('Error fetching data:', err);
         setError(err instanceof Error ? err.message : 'An error occurred');
       } finally {
         setLoading(false);
       }
     };

     fetchData();
   }, [slug]);

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
     if (navigator.share && post) {
       try {
         await navigator.share({
           title: post.title_ar || post.title || '',
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
     const date = new Date(dateString);
     return date.toLocaleDateString('ar-EG', {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
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
              onClick={() => router.push('/')}
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
                onClick={() => router.push('/')}
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
                  <Link key={latestPost.id} href={`/post/${latestPost.slug}`}>
                    <div className="flex gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg">
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