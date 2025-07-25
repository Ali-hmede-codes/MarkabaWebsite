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
        {/* Header Section with Logo and مركبا */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <Image 
                  src="/images/logo.png" 
                  alt="مركبا" 
                  width={40} 
                  height={40} 
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">مركبا</h1>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString('ar-EG')}
            </div>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-4 py-8 bg-white">
          {/* Category Display */}
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {post.category_name_ar}
            </span>
          </div>

          {/* Post Title */}
          <h1 className="text-3xl font-bold mb-4 text-gray-900 leading-tight">{post.title_ar}</h1>
          
          {/* Post Summary/Excerpt */}
          {post.excerpt_ar && (
            <div className="mb-6 p-4 bg-gray-50 border-r-4 border-blue-500 rounded-lg">
              <p className="text-gray-700 text-lg leading-relaxed font-medium">{post.excerpt_ar}</p>
            </div>
          )}

          {/* Author and Date Info */}
          <div className="flex items-center mb-6 text-gray-600 border-b border-gray-200 pb-4">
            <FiUser className="ml-2" />
            <span className="mr-4">{post.author_name}</span>
            <FiCalendar className="ml-2" />
            <span className="mr-4">{new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
            <FiEye className="ml-2" />
            <span>{post.views} مشاهدة</span>
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