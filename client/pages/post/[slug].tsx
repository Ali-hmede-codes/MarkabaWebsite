import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { useAPI, usePosts, useBreakingNews } from '../../components/API/hooks';
import { Post, BreakingNews } from '../../components/API/types';
import { FiCalendar, FiCopy, FiShare2 } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';

import Layout from '../../components/Layout/Layout';
import Link from 'next/link';

const SinglePostPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

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
          title: document.title,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyText(window.location.href);
    }
  };

  const InnerPost = ({ slug }: { slug: string }) => {
    const { data: response, loading, error } = useAPI<{ posts: Post[]; total: number }>('/posts', {
      immediate: true,
      params: { slug, limit: 1, page: 1 }
    });
    const { data: postsResponse } = usePosts({ limit: 4 });
    const breakingNewsResponse = useBreakingNews();
    const [latestPosts, setLatestPosts] = useState<Post[]>([]);
    const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
    const post = response?.posts?.[0];

    useEffect(() => {
      if (postsResponse?.posts) {
        const filtered = postsResponse.posts.filter((p) => p.id !== post?.id);
        setLatestPosts(filtered.slice(0, 4));
      }
    }, [postsResponse, post]);

    useEffect(() => {
      if (breakingNewsResponse?.data && Array.isArray(breakingNewsResponse.data)) {
        const filtered = breakingNewsResponse.data.filter((p: BreakingNews) => p.id !== post?.id);
        setBreakingNews(filtered.slice(0, 4));
      }
    }, [breakingNewsResponse, post]);

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
    if (error || !post) return <div className="text-center py-10 text-red-500">المنشور غير موجود</div>;

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <Layout title={post.title_ar || post.title} description={post.excerpt_ar || post.excerpt}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
          {/* Post Title - Outside the box */}
          <h1 className="text-3xl font-bold mb-6 text-gray-900 leading-tight">{post.title_ar || post.title}</h1>
          
          {/* Summary Box */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8 overflow-hidden">
            {/* Content section */}
            <div className="p-6">
              {/* Post Summary/Excerpt */}
              {(post.excerpt_ar || post.excerpt) && (
                <div className="mb-4">
                  <p className="text-gray-700 text-base leading-relaxed">{post.excerpt_ar || post.excerpt}</p>
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
                        {new Date(post.created_at).toLocaleDateString('ar-EG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
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
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="نسخ النص"
                  >
                    <FiCopy size={16} />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
               <Image src={getImageUrl(post.featured_image || post.image || '')} alt={post.title_ar || post.title} fill className="object-cover rounded-lg shadow-lg" />
             </div>
           )}

           {/* Post Content */}
           <div className="prose max-w-none mb-8 text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content_ar || post.content }} />
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
                    <Link key={newsPost.id} href={`/breaking/${newsPost.id}`}>
                      <div className="flex gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {newsPost.title_ar || newsPost.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(newsPost.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Layout>
    );
  };

  if (!slug) return <div className="text-center py-10">جاري التحميل...</div>;

  return router.isReady ? <InnerPost slug={slug} key={slug} /> : <div className="text-center py-10">جاري التحميل...</div>;
};

export default SinglePostPage;