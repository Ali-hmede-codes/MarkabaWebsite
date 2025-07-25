import { useRouter } from 'next/router';
import React from 'react';
import { useAPI } from '../../components/API/hooks';
import { FiCalendar, FiEye, FiUser } from 'react-icons/fi';
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
            {/* Header section with logo and site name */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-8 h-8 rounded overflow-hidden">
                    <Image 
                      src="/images/logo.png" 
                      alt="مركبا" 
                      width={32} 
                      height={32} 
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">مركبا</h2>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString('ar-EG')}
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
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <FiEye size={16} />
                    <span>{post.views} مشاهدة</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 4v16l5-5h13V4H3z"/>
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9h1a1 1 0 0 0 0-2zM10 6a2 2 0 0 1 4 0v1h-4V6zm6 15a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9h8v12z"/>
                    </svg>
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