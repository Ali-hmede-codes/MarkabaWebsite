import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useAPI } from '../../components/API/hooks';
import { FiCalendar, FiUser, FiCopy, FiShare2 } from 'react-icons/fi';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';

type Post = {
  id: number;
  title_ar: string;
  content_ar: string;
  featured_image: string;
  excerpt_ar: string;
  author_name: string;
  created_at: string;
  category_name_ar: string;
  reading_time: number;
  views: number;
};

const SinglePostPage: React.FC = () => {
  const router = useRouter();
  const { slug: slugParam } = router.query;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
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
      handleCopyLink();
    }
  };

  const InnerPost = ({ slug }: { slug: string }) => {
    const { data: response, loading, error } = useAPI<{ posts: Post[]; total: number }>('/posts', {
      immediate: true,
      params: { slug, limit: 1, page: 1 }
    });
    const post = response?.posts?.[0];

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
    if (error || !post) return <div className="text-center py-10 text-red-500">المنشور غير موجود</div>;

    return (
      <Layout title={post.title_ar} description={post.excerpt_ar}>
        <article className="max-w-4xl mx-auto px-4 py-8 bg-white">
          {/* Header Box with Logo, Title and Summary - matching the photo style */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8 overflow-hidden">
            {/* Header section with logo, site name and date */}
            <div className="bg-red-600 text-white px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <Image 
                      src="/images/logo.png" 
                      alt="مركبا" 
                      width={28} 
                      height={28} 
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">مركبا</h2>
                    <div className="text-sm opacity-90">
                      {new Date(post.created_at).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">الأخبار</div>
                </div>
              </div>
            </div>
            
            {/* Content section */}
            <div className="p-6">
              {/* Category Display */}
              <div className="mb-4">
                <span className="inline-block bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">
                  {post.category_name_ar}
                </span>
              </div>

              {/* Post Title */}
              <h1 className="text-2xl font-bold mb-4 text-gray-900 leading-tight">{post.title_ar}</h1>
              
              {/* Post Summary/Excerpt */}
              {post.excerpt_ar && (
                <div className="mb-4">
                  <p className="text-gray-700 text-base leading-relaxed">{post.excerpt_ar}</p>
                </div>
              )}
              
              {/* Social sharing and info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <FiUser size={16} />
                    <span>{post.author_name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button 
                    onClick={handleCopyLink}
                    className={`p-2 transition-colors ${
                      copySuccess 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="نسخ الرابط"
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
           {post.featured_image && (
             <div className="relative w-full aspect-video md:h-96 md:aspect-auto mb-8">
               <Image src={getImageUrl(post.featured_image)} alt={post.title_ar} fill className="object-cover rounded-lg shadow-lg" />
             </div>
           )}

           {/* Post Content */}
           <div className="prose max-w-none mb-8 text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content_ar }} />
        </article>
      </Layout>
    );
  };

  if (!slug) return <div className="text-center py-10">جاري التحميل...</div>;

  return router.isReady ? <InnerPost slug={slug} key={slug} /> : <div className="text-center py-10">جاري التحميل...</div>;
};

export default SinglePostPage;